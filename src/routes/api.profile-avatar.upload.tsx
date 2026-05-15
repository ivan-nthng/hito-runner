import { createFileRoute } from "@tanstack/react-router";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { requirePersistedUserIdForCurrentRequest } from "@/lib/request-persisted-user";

const PROFILE_AVATAR_STORAGE_BUCKET = "profile-avatars";
const MAX_AVATAR_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const Route = createFileRoute("/api/profile-avatar/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const formData = await request.formData();
          const fileEntry = formData.get("file");

          if (!(fileEntry instanceof File)) {
            return Response.json(
              {
                ok: false,
                message: "Choose an avatar image before uploading.",
              },
              { status: 400 },
            );
          }

          if (fileEntry.size <= 0 || fileEntry.size > MAX_AVATAR_UPLOAD_BYTES) {
            return Response.json(
              {
                ok: false,
                message: "Choose an image under 5 MB.",
              },
              { status: 400 },
            );
          }

          if (!ALLOWED_AVATAR_MIME_TYPES.has(fileEntry.type)) {
            return Response.json(
              {
                ok: false,
                message: "Use a JPEG, PNG, or WebP avatar image.",
              },
              { status: 400 },
            );
          }

          const userId = await requirePersistedUserIdForCurrentRequest();
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
            return Response.json(
              {
                ok: false,
                message: "Finish setup before uploading an avatar.",
              },
              { status: 400 },
            );
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
          if (
            error instanceof Error &&
            error.message === "Authentication is required for this action."
          ) {
            return Response.json(
              {
                ok: false,
                message: "Sign in again before changing your avatar.",
              },
              { status: 401 },
            );
          }

          return Response.json(
            {
              ok: false,
              message:
                error instanceof Error
                  ? error.message
                  : "The avatar could not be uploaded in this environment.",
            },
            { status: 500 },
          );
        }
      },
    },
  },
  component: () => null,
});
