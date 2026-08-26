export type LocalNotionCaptureKind = "task" | "bug" | "content_bug";
export type LocalNotionCaptureSource = "inspector_batch" | "screen_capture";

export type LocalNotionCaptureInput = {
  evidence: string[];
  kind: LocalNotionCaptureKind;
  note: string;
  pageTitle: string;
  route: string;
  source: LocalNotionCaptureSource;
  theme: string;
  title?: string;
  viewport: { height: number; width: number };
};

export type LocalNotionSubmission = {
  deduplicated: boolean;
  hitoId: string | null;
  pageId: string;
  pageUrl: string;
};

type LocalNotionSubmissionResponse =
  | ({ ok: true } & LocalNotionSubmission)
  | { message?: string; ok: false; reason?: string };

const LOCAL_NOTION_SUBMISSION_FAILURE =
  "Notion could not accept the capture. The local draft is unchanged.";

export async function submitLocalNotionCapture(
  input: LocalNotionCaptureInput,
): Promise<LocalNotionSubmission> {
  const endpoint = resolveLocalNotionCaptureEndpoint();
  let response: Response;
  try {
    response = await fetch(endpoint, {
      body: JSON.stringify(input),
      headers: {
        "Content-Type": "application/json",
        "X-Hito-Local-Debugger": "v1",
      },
      method: "POST",
    });
  } catch {
    throw new Error(LOCAL_NOTION_SUBMISSION_FAILURE);
  }
  const result = (await response.json().catch(() => null)) as LocalNotionSubmissionResponse | null;

  if (!response.ok || !result?.ok) {
    throw new Error(
      result && !result.ok && result.message ? result.message : LOCAL_NOTION_SUBMISSION_FAILURE,
    );
  }

  return {
    deduplicated: result.deduplicated,
    hitoId: result.hitoId,
    pageId: result.pageId,
    pageUrl: result.pageUrl,
  };
}

export function resolveLocalNotionCaptureEndpoint(location = window.location) {
  const appPort = Number(location.port);
  const hostname = location.hostname.toLowerCase();
  const isLoopback =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]" ||
    /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname);

  if (location.protocol !== "http:" || !isLoopback || !Number.isInteger(appPort)) {
    throw new Error("Notion submission is available only from the local Hito runtime.");
  }

  const urlHostname =
    hostname === "[::1]" ? hostname : hostname.includes(":") ? `[${hostname}]` : hostname;
  return `http://${urlHostname}:${appPort + 1}/__hito/local-notion-task`;
}
