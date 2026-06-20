import { mkdtemp, mkdir, open, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import yauzl from "yauzl";
import {
  ExtractedGarminFitFile,
  WorkoutResultAssetKind,
  WorkoutResultImportError,
} from "@/lib/workout-result-import/types";

export function classifyWorkoutResultUpload(fileName: string): WorkoutResultAssetKind {
  const lowerName = fileName.trim().toLowerCase();

  if (lowerName.endsWith(".fit")) {
    return "garmin_fit";
  }

  if (lowerName.endsWith(".zip")) {
    return "garmin_zip";
  }

  throw new WorkoutResultImportError(
    "unsupported_file_type",
    "Only Garmin .fit files or .zip archives that contain one FIT activity are supported in this release.",
    415,
  );
}

export async function extractPrimaryFitFromArchive(
  zipBuffer: Buffer,
): Promise<ExtractedGarminFitFile> {
  const workspace = await mkdtemp(path.join(tmpdir(), "hito-fit-upload-"));

  try {
    const entries = await listArchiveEntries(zipBuffer);
    const fitEntries = entries.filter((entry) => entry.toLowerCase().endsWith(".fit"));

    if (fitEntries.length === 0) {
      throw new WorkoutResultImportError(
        "zip_missing_fit",
        "This ZIP does not contain a usable .fit activity file.",
        422,
      );
    }

    if (fitEntries.length > 1) {
      throw new WorkoutResultImportError(
        "zip_multiple_fit",
        "This ZIP contains more than one .fit file. Upload a ZIP with one Garmin activity FIT file only.",
        422,
      );
    }

    const primaryFileName = fitEntries[0]!;
    const extractedPath = path.join(workspace, path.basename(primaryFileName));
    const extractedBuffer = await extractArchiveEntryToFile(
      zipBuffer,
      primaryFileName,
      extractedPath,
    );

    return {
      primaryFileKind: "fit",
      primaryFileName,
      fileBuffer: extractedBuffer,
    };
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}

async function listArchiveEntries(zipBuffer: Buffer): Promise<string[]> {
  return await new Promise((resolve, reject) => {
    yauzl.fromBuffer(zipBuffer, { lazyEntries: true }, (error, zipFile) => {
      if (error || !zipFile) {
        reject(
          new WorkoutResultImportError(
            "invalid_upload",
            "The uploaded ZIP archive could not be read.",
            422,
          ),
        );
        return;
      }

      const names: string[] = [];

      zipFile.on("entry", (entry) => {
        if (!entry.fileName.endsWith("/")) {
          names.push(entry.fileName);
        }

        zipFile.readEntry();
      });

      zipFile.once("end", () => {
        zipFile.close();
        resolve(names);
      });
      zipFile.once("error", reject);
      zipFile.readEntry();
    });
  });
}

async function extractArchiveEntryToFile(
  zipBuffer: Buffer,
  targetFileName: string,
  outputPath: string,
) {
  await mkdir(path.dirname(outputPath), { recursive: true });

  return await new Promise<Buffer>((resolve, reject) => {
    yauzl.fromBuffer(zipBuffer, { lazyEntries: true }, (error, zipFile) => {
      if (error || !zipFile) {
        reject(
          new WorkoutResultImportError(
            "invalid_upload",
            "The uploaded ZIP archive could not be read.",
            422,
          ),
        );
        return;
      }

      let resolved = false;

      zipFile.on("entry", (entry) => {
        if (entry.fileName !== targetFileName) {
          zipFile.readEntry();
          return;
        }

        zipFile.openReadStream(entry, async (streamError, readStream) => {
          if (streamError || !readStream) {
            reject(
              new WorkoutResultImportError(
                "invalid_upload",
                "The FIT file inside the ZIP archive could not be read.",
                422,
              ),
            );
            return;
          }

          const chunks: Buffer[] = [];

          readStream.on("data", (chunk) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          });

          readStream.once("error", reject);
          readStream.once("end", async () => {
            try {
              const fileBuffer = Buffer.concat(chunks);
              const fileHandle = await open(outputPath, "w");
              await fileHandle.writeFile(fileBuffer);
              await fileHandle.close();
              resolved = true;
              zipFile.close();
              resolve(await readFile(outputPath));
            } catch (writeError) {
              reject(writeError);
            }
          });
        });
      });

      zipFile.once("end", () => {
        if (!resolved) {
          reject(
            new WorkoutResultImportError(
              "zip_missing_fit",
              "This ZIP does not contain a usable .fit activity file.",
              422,
            ),
          );
        }
      });
      zipFile.once("error", reject);
      zipFile.readEntry();
    });
  });
}
