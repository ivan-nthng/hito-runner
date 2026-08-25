import { createFileRoute } from "@tanstack/react-router";
import { readBoundedMultipartFormData } from "@/lib/bounded-multipart-form-data";
import {
  buildHitoProductApiFailure,
  type HitoProductApiFailure,
} from "@/lib/product-api-error-contract";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { requirePersistedUserIdForCurrentRequest } from "@/lib/request-persisted-user";

const PROFILE_AVATAR_STORAGE_BUCKET = "profile-avatars";
const MAX_AVATAR_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_AVATAR_MULTIPART_BYTES = MAX_AVATAR_UPLOAD_BYTES + 1024 * 1024;
const ALLOWED_AVATAR_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

class AvatarUploadRequestError extends Error {
  constructor(
    readonly failure: HitoProductApiFailure<"avatar_file_too_large">,
    readonly status: 400 | 413,
  ) {
    super(failure.code);
    this.name = "AvatarUploadRequestError";
  }
}

type AvatarUploadPublicFailure = {
  status: 400 | 401 | 413 | 500;
  failure: HitoProductApiFailure;
  report: boolean;
};

export const Route = createFileRoute("/api/profile-avatar/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const userId = await requirePersistedUserIdForCurrentRequest();
          const formData = await readBoundedMultipartFormData(
            request,
            MAX_AVATAR_MULTIPART_BYTES,
            avatarMultipartTooLargeError,
          );
          const fileEntry = formData.get("file");

          if (!(fileEntry instanceof File)) {
            return Response.json(buildHitoProductApiFailure("avatar_file_required", {}), {
              status: 400,
            });
          }

          if (fileEntry.size <= 0) {
            return Response.json(buildHitoProductApiFailure("avatar_file_empty", {}), {
              status: 400,
            });
          }

          if (fileEntry.size > MAX_AVATAR_UPLOAD_BYTES) {
            throw avatarMultipartTooLargeError();
          }

          if (!ALLOWED_AVATAR_MIME_TYPES.has(fileEntry.type)) {
            return Response.json(
              buildHitoProductApiFailure("avatar_file_type_unsupported", {
                allowedMimeTypes: [...ALLOWED_AVATAR_MIME_TYPES],
              }),
              { status: 400 },
            );
          }

          const supabase = createAdminSupabaseClient();
          const profileResult = await supabase
            .from("runner_profiles")
            .select("user_id, avatar_storage_path")
            .eq("user_id", userId)
            .maybeSingle();

          if (profileResult.error) {
            throw new Error(profileResult.error.message);
          }

          if (!profileResult.data) {
            return Response.json(buildHitoProductApiFailure("avatar_profile_required", {}), {
              status: 400,
            });
          }

          const storagePath = `${userId}/avatar-${crypto.randomUUID()}.jpg`;
          const fileBuffer = Buffer.from(await fileEntry.arrayBuffer());
          const upload = await supabase.storage
            .from(PROFILE_AVATAR_STORAGE_BUCKET)
            .upload(storagePath, fileBuffer, {
              contentType: "image/jpeg",
              upsert: false,
            });

          if (upload.error) {
            throw new Error(upload.error.message);
          }

          const avatarUrl = supabase.storage
            .from(PROFILE_AVATAR_STORAGE_BUCKET)
            .getPublicUrl(storagePath).data.publicUrl;
          const update = await supabase
            .from("runner_profiles")
            .update({
              avatar_url: avatarUrl,
              avatar_storage_path: storagePath,
            })
            .eq("user_id", userId)
            .select("avatar_url, avatar_storage_path")
            .single();

          if (update.error) {
            await supabase.storage.from(PROFILE_AVATAR_STORAGE_BUCKET).remove([storagePath]);
            throw new Error(update.error.message);
          }

          const previousPath = profileResult.data.avatar_storage_path;

          if (previousPath && previousPath !== storagePath) {
            await supabase.storage.from(PROFILE_AVATAR_STORAGE_BUCKET).remove([previousPath]);
          }

          return Response.json(
            {
              ok: true,
              avatarUrl: update.data.avatar_url,
            },
            { status: 200 },
          );
        } catch (error) {
          const failure = getAvatarUploadPublicFailure(error);
          if (failure.report) {
            console.error("[api/profile-avatar/upload] unexpected avatar upload failure", error);
          }

          return Response.json(failure.failure, { status: failure.status });
        }
      },
    },
  },
  component: () => null,
});

function getAvatarUploadPublicFailure(error: unknown): AvatarUploadPublicFailure {
  if (error instanceof AvatarUploadRequestError) {
    return { status: error.status, failure: error.failure, report: false };
  }

  if (error instanceof Error && error.message === "Authentication is required for this action.") {
    return {
      status: 401,
      failure: buildHitoProductApiFailure("avatar_auth_required", {}),
      report: false,
    };
  }

  return {
    status: 500,
    failure: buildHitoProductApiFailure("avatar_upload_failed", {}),
    report: true,
  };
}

function avatarMultipartTooLargeError() {
  return new AvatarUploadRequestError(
    buildHitoProductApiFailure("avatar_file_too_large", {
      maxBytes: MAX_AVATAR_UPLOAD_BYTES,
    }),
    413,
  );
}
