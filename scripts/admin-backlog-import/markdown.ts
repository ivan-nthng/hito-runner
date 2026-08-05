import path from "node:path";
import {
  adminCaptureTargetRoles,
  type AdminCaptureTargetRole,
} from "../../src/lib/admin-capture-contract";
import {
  isAdminRepoWorkItemArchiveIntent,
  isAdminRepoWorkItemFrontendLane,
  isAdminRepoWorkItemOwner,
  isAdminRepoWorkItemPriority,
  isAdminRepoWorkItemStatus,
  isAdminRepoWorkItemType,
  type AdminRepoWorkItemArchiveIntent,
  type AdminRepoWorkItemFrontendLane,
  type AdminRepoWorkItemMetadataState,
  type AdminRepoWorkItemOwner,
  type AdminRepoWorkItemPriority,
  type AdminRepoWorkItemSourceType,
  type AdminRepoWorkItemStatus,
  type AdminRepoWorkItemType,
} from "../../src/lib/admin-work-items";
import type { Json } from "../../src/lib/supabase/database";

const MAX_NOTE_LENGTH = 3900;

export const CANONICAL_MARKDOWN_FIELDS = [
  "Work Item ID",
  "Status",
  "Type",
  "Priority",
  "Owner",
  "Scope",
  "Archive Intent",
  "Task",
  "Batch",
  "Frontend Lane",
  "Next Recommended Role",
  "Stage",
  "Exact Handoff Prompt",
] as const;

const CORE_CANONICAL_MARKDOWN_FIELDS = [
  "Work Item ID",
  "Status",
  "Type",
  "Priority",
  "Owner",
  "Scope",
  "Archive Intent",
  "Task",
] as const satisfies readonly CanonicalMarkdownField[];

export type AdminItemType = "bug" | "change_request" | "context_capture";
export type AdminStatus = "new" | "in_review" | "ready_for_codex" | "done" | "archived";
export type AdminPriority = AdminRepoWorkItemPriority;
export type MarkdownItemType = AdminRepoWorkItemType;
export type TargetRole = AdminCaptureTargetRole;
export type WorkItemStatus = AdminRepoWorkItemStatus;
export type CanonicalMarkdownField = (typeof CANONICAL_MARKDOWN_FIELDS)[number];
export type CanonicalMetadataState = AdminRepoWorkItemMetadataState;

export type ParsedCanonicalMarkdown = {
  workItemId: string | null;
  status: WorkItemStatus | null;
  itemType: MarkdownItemType | null;
  priority: AdminPriority | null;
  owner: AdminRepoWorkItemOwner | null;
  scope: string | null;
  archiveIntent: AdminRepoWorkItemArchiveIntent | null;
  batch: string | null;
  frontendLane: AdminRepoWorkItemFrontendLane | null;
  nextRole: TargetRole | null;
  task: string | null;
  stage: string | null;
  exactHandoffPrompt: string | null;
  metadataState: CanonicalMetadataState;
  missingRequiredFields: CanonicalMarkdownField[];
  invalidRequiredFields: CanonicalMarkdownField[];
  raw: Partial<Record<CanonicalMarkdownField, string>>;
};

export function extractTitle(markdown: string) {
  const heading = extractFirstHeading(markdown, 1);
  return heading ? stripInlineMarkdown(heading) : null;
}

export function extractStatusText(markdown: string) {
  const status =
    firstMeaningfulLine(extractMarkdownSection(markdown, "Status")) ??
    extractKeyValue(markdown, "Status") ??
    extractKeyValue(markdown, "Verdict") ??
    extractKeyValue(markdown, "Classification");

  return status ? truncate(stripInlineMarkdown(status), 240) : null;
}

export function extractSectionText(markdown: string, heading: string) {
  const section = extractMarkdownSection(markdown, heading);
  const firstLine = firstMeaningfulLine(section);

  return firstLine ? truncate(stripInlineMarkdown(firstLine), 240) : null;
}

function extractKeyValue(markdown: string, key: string) {
  const match = markdown.match(new RegExp(`^${escapeRegExp(key)}:\\s*(.+?)\\s*$`, "im"));
  return match ? match[1] : null;
}

export function inferWorkItemStatus(
  sourceType: AdminRepoWorkItemSourceType,
  sourceStatusText: string | null,
  markdown: string,
): WorkItemStatus {
  const signal = `${sourceStatusText ?? ""}\n${markdown.slice(0, 1800)}`.toLowerCase();

  if (/\b(won'?t do|not needed|cancelled|canceled|superseded|closed)\b/.test(signal)) {
    return "closed";
  }

  if (sourceType === "archived_plan") {
    if (/\b(complete|completed|passed|done|qa-passed|qa passed)\b/.test(signal)) {
      return "completed";
    }

    return "archived";
  }

  if (sourceType === "active_plan") {
    if (/\b(paused|backlog|blocked|waiting)\b/.test(signal)) {
      return "backlog";
    }

    if (/\b(active|in progress|implemented|needs|ready|qa-passed|qa passed)\b/.test(signal)) {
      return "in_progress";
    }

    if (/\b(complete|completed|passed|done)\b/.test(signal)) {
      return "completed";
    }

    return "in_progress";
  }

  if (/\b(complete|completed|passed|done|qa-passed|qa passed)\b/.test(signal)) {
    return "completed";
  }

  return "backlog";
}

export function inferTargetRole(
  sourceType: AdminRepoWorkItemSourceType,
  sourcePath: string,
  searchText: string,
): TargetRole {
  const normalized = searchText.toLowerCase();
  const explicit = normalized.match(
    /\brole:\s*(backend|frontend|qa|copy|designer|architect|product|running[\s_-]*coach)\b/,
  );

  if (explicit) {
    return normalizeRole(explicit[1]) ?? "architect";
  }

  if (sourceType === "frontend_spec") {
    return "frontend";
  }

  if (sourceType === "product_brief") {
    return "architect";
  }

  const combined = `${sourcePath}\n${normalized}`;

  if (/\brunning coach\b|\bcoach\b/.test(combined)) {
    return "running_coach";
  }

  if (/\bqa\b|\btest\b|\bregression\b|\bsmoke\b|\bverdict\b/.test(combined)) {
    return "qa";
  }

  if (/\bcopy\b|\bcontent\b|\bmicrocopy\b/.test(combined)) {
    return "copy";
  }

  if (/\bdesign\b|\bdesigner\b|\bfigma\b|\bvisual\b/.test(combined)) {
    return "designer";
  }

  if (/\bprompt\b|\bhandoff\b|\bproduct\b/.test(combined)) {
    return "product";
  }

  if (
    /\bbackend\b|\bsupabase\b|\bdatabase\b|\bmigration\b|\bserver\b|\bauth\b|\bapi\b|\brpc\b|\badmin\b/.test(
      combined,
    )
  ) {
    return "backend";
  }

  if (/\bfrontend\b|\bui\b|\bcomponent\b|\broute\b|\btsx\b|\browser\b|\bds\b/.test(combined)) {
    return "frontend";
  }

  return "architect";
}

export function inferItemType(
  sourceType: AdminRepoWorkItemSourceType,
  searchText: string,
): AdminItemType {
  const normalized = searchText.toLowerCase();

  if (/\bbug\b|\bfix\b|\bfail\b|\bfailed\b|\bregression\b|\bblocker\b/.test(normalized)) {
    return "bug";
  }

  if (sourceType === "active_plan" || sourceType === "archived_plan") {
    return "context_capture";
  }

  return "change_request";
}

export function mapWorkItemStatusToAdminStatus(status: WorkItemStatus): AdminStatus {
  switch (status) {
    case "backlog":
    case "blocked":
      return "new";
    case "ready":
    case "in_progress":
      return "ready_for_codex";
    case "completed":
      return "done";
    case "closed":
      return "done";
    case "archived":
      return "archived";
  }
}

export function mapMirroredWorkItemStatusToAdminStatus(
  status: WorkItemStatus,
  metadataState: CanonicalMetadataState,
): AdminStatus {
  const mapped = mapWorkItemStatusToAdminStatus(status);

  return metadataState === "complete" || mapped === "done" || mapped === "archived"
    ? mapped
    : "new";
}

export function buildRepoMirrorNote(input: {
  sourcePath: string;
  sourceType: AdminRepoWorkItemSourceType;
  workItemStatus: WorkItemStatus;
  owner: string | null;
  lastUpdated: string | null;
  excerpt: string;
  canonical: ParsedCanonicalMarkdown;
}) {
  if (input.canonical.exactHandoffPrompt) {
    return truncate(input.canonical.exactHandoffPrompt, MAX_NOTE_LENGTH);
  }

  if (input.canonical.task || input.canonical.stage || input.canonical.nextRole) {
    const role = input.canonical.nextRole
      ? formatMarkdownRole(input.canonical.nextRole).toUpperCase()
      : "ARCHITECT";
    const prompt = [
      `ROLE: ${role}`,
      "",
      "TASK:",
      input.canonical.task ?? titleFromFilename(input.sourcePath),
      "",
      "STAGE:",
      input.canonical.stage ?? `${role} handoff`,
      "",
      "CONTEXT:",
      `Source path: ${input.sourcePath}`,
      `Source type: ${input.sourceType}`,
      `Work item status: ${input.workItemStatus}`,
      input.owner ? `Owner: ${input.owner}` : null,
      input.lastUpdated ? `Last updated: ${input.lastUpdated}` : null,
      "",
      input.excerpt,
    ]
      .filter(Boolean)
      .join("\n");

    return truncate(prompt, MAX_NOTE_LENGTH);
  }

  const note = [
    "Repo work item mirror. Markdown remains canonical; Supabase stores only a bounded admin Backlog index.",
    `Source path: ${input.sourcePath}`,
    `Source type: ${input.sourceType}`,
    `Work item status: ${input.workItemStatus}`,
    input.owner ? `Owner: ${input.owner}` : null,
    input.lastUpdated ? `Last updated: ${input.lastUpdated}` : null,
    "",
    "Role-ready excerpt:",
    input.excerpt,
  ]
    .filter(Boolean)
    .join("\n");

  return truncate(note, MAX_NOTE_LENGTH);
}

export function parseCanonicalMarkdown(markdown: string): ParsedCanonicalMarkdown {
  const raw: Partial<Record<CanonicalMarkdownField, string>> = {};
  const missingRequiredFields: CanonicalMarkdownField[] = [];
  const invalidRequiredFields: CanonicalMarkdownField[] = [];
  const sections = parseLeadMarkdownMetadataSections(markdown);

  for (const field of CORE_CANONICAL_MARKDOWN_FIELDS) {
    const value = sections.get(field);

    if (!value) {
      missingRequiredFields.push(field);
    } else {
      raw[field] = value;
    }
  }

  for (const field of CANONICAL_MARKDOWN_FIELDS) {
    const value = sections.get(field);

    if (value) {
      raw[field] = value;
    }
  }

  const workItemId = normalizeSlug(firstMeaningfulLine(raw["Work Item ID"] ?? null));
  const status = normalizeMarkdownStatus(firstMeaningfulLine(raw.Status ?? null));
  const itemType = normalizeMarkdownItemType(firstMeaningfulLine(raw.Type ?? null));
  const priority = normalizeMarkdownPriority(firstMeaningfulLine(raw.Priority ?? null));
  const owner = normalizeMarkdownOwner(firstMeaningfulLine(raw.Owner ?? null));
  const scope = normalizeSlug(firstMeaningfulLine(raw.Scope ?? null));
  const archiveIntent = normalizeMarkdownArchiveIntent(
    firstMeaningfulLine(raw["Archive Intent"] ?? null),
  );
  const batch = normalizeSlug(firstMeaningfulLine(raw.Batch ?? null));
  const frontendLane = normalizeMarkdownFrontendLane(
    firstMeaningfulLine(raw["Frontend Lane"] ?? null),
  );
  const nextRole = normalizeCanonicalMarkdownRole(
    firstMeaningfulLine(raw["Next Recommended Role"] ?? null),
  );

  if (raw["Work Item ID"] && !workItemId) {
    invalidRequiredFields.push("Work Item ID");
  }

  if (raw.Status && !status) {
    invalidRequiredFields.push("Status");
  }

  if (raw.Type && !itemType) {
    invalidRequiredFields.push("Type");
  }

  if (raw.Priority && !priority) {
    invalidRequiredFields.push("Priority");
  }

  if (raw.Owner && !owner) {
    invalidRequiredFields.push("Owner");
  }

  if (raw.Scope && !scope) {
    invalidRequiredFields.push("Scope");
  }

  if (raw["Archive Intent"] && !archiveIntent) {
    invalidRequiredFields.push("Archive Intent");
  }

  if (raw.Batch && !batch) {
    invalidRequiredFields.push("Batch");
  }

  if (raw["Frontend Lane"] && !frontendLane) {
    invalidRequiredFields.push("Frontend Lane");
  }

  if (raw["Next Recommended Role"] && !nextRole) {
    invalidRequiredFields.push("Next Recommended Role");
  }

  const task = raw.Task ? truncate(stripInlineMarkdown(raw.Task), 1200) : null;
  const stage = raw.Stage ? truncate(stripInlineMarkdown(raw.Stage), 240) : null;
  const exactHandoffPrompt = raw["Exact Handoff Prompt"]
    ? extractFencedPrompt(raw["Exact Handoff Prompt"])
    : null;
  const requiresExecutionHandoff = status === "ready" || status === "in_progress";
  const requiresBlockedStage = status === "blocked";
  const requiresFrontendLane = owner === "frontend" || nextRole === "frontend";

  if (requiresExecutionHandoff) {
    addMissingField(missingRequiredFields, raw, "Next Recommended Role");
    addMissingField(missingRequiredFields, raw, "Stage");
    addMissingField(missingRequiredFields, raw, "Exact Handoff Prompt");
  } else if (requiresBlockedStage) {
    addMissingField(missingRequiredFields, raw, "Stage");

    if (Boolean(nextRole) !== Boolean(exactHandoffPrompt)) {
      invalidRequiredFields.push(nextRole ? "Exact Handoff Prompt" : "Next Recommended Role");
    }
  }

  if (requiresFrontendLane) {
    addMissingField(missingRequiredFields, raw, "Frontend Lane");
  }

  if (exactHandoffPrompt) {
    const promptRole = extractPromptRole(exactHandoffPrompt);

    if (!promptRole || (nextRole && promptRole !== nextRole)) {
      invalidRequiredFields.push("Exact Handoff Prompt");
    }
  } else if (raw["Exact Handoff Prompt"]) {
    invalidRequiredFields.push("Exact Handoff Prompt");
  }

  const uniqueMissingFields = uniqueFields(missingRequiredFields);
  const uniqueInvalidFields = uniqueFields(invalidRequiredFields);
  const metadataState: CanonicalMetadataState =
    uniqueInvalidFields.length > 0 || (workItemId && uniqueMissingFields.length > 0)
      ? "malformed"
      : uniqueMissingFields.length > 0
        ? "legacy_debt"
        : "complete";

  return {
    workItemId,
    status,
    itemType,
    priority,
    owner,
    scope,
    archiveIntent,
    batch,
    frontendLane,
    nextRole,
    task,
    stage,
    exactHandoffPrompt,
    metadataState,
    missingRequiredFields: uniqueMissingFields,
    invalidRequiredFields: uniqueInvalidFields,
    raw,
  };
}

function addMissingField(
  fields: CanonicalMarkdownField[],
  raw: Partial<Record<CanonicalMarkdownField, string>>,
  field: CanonicalMarkdownField,
) {
  if (!raw[field]) {
    fields.push(field);
  }
}

function uniqueFields(fields: CanonicalMarkdownField[]) {
  return Array.from(new Set(fields));
}

function parseLeadMarkdownMetadataSections(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  let inFence = false;
  let fenceMarker: string | null = null;
  let currentHeading: CanonicalMarkdownField | null = null;
  let currentBody: string[] = [];
  let startedLeadBlock = false;
  const sections = new Map<CanonicalMarkdownField, string>();

  const commitCurrent = () => {
    if (!currentHeading) {
      return;
    }

    const value = currentBody.join("\n").trim();

    if (value && !sections.has(currentHeading)) {
      sections.set(currentHeading, value);
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const fenceMatch = trimmed.match(/^(`{3,}|~{3,})/);

    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        fenceMarker = fenceMatch[1][0];
      } else if (fenceMarker && trimmed.startsWith(fenceMarker.repeat(3))) {
        inFence = false;
        fenceMarker = null;
      }

      if (currentHeading) {
        currentBody.push(line);
      }

      continue;
    }

    if (!inFence) {
      const headingMatch = line.match(/^(#{1,6})\s+(.+?)\s*$/);

      if (headingMatch && headingMatch[1].length === 2) {
        const label = stripInlineMarkdown(headingMatch[2]);
        const canonicalField = findCanonicalMarkdownField(label);
        const allowedLeadHeading = canonicalField || ["Owner", "Last Updated"].includes(label);

        if (startedLeadBlock && !allowedLeadHeading) {
          commitCurrent();
          return sections;
        }

        if (!startedLeadBlock && !allowedLeadHeading && label !== "Status") {
          continue;
        }

        startedLeadBlock = true;
        commitCurrent();
        currentHeading = canonicalField;
        currentBody = [];
        continue;
      }

      if (line.match(/^#\s+.+?$/)) {
        continue;
      }
    }

    if (currentHeading) {
      currentBody.push(line);
    }
  }

  commitCurrent();
  return sections;
}

function findCanonicalMarkdownField(input: string): CanonicalMarkdownField | null {
  return (
    CANONICAL_MARKDOWN_FIELDS.find((field) => field.toLowerCase() === input.trim().toLowerCase()) ??
    null
  );
}

function extractMarkdownSection(markdown: string, heading: string) {
  const lines = markdown.split(/\r?\n/);
  let inFence = false;
  let fenceMarker: string | null = null;
  let collecting = false;
  let sectionLevel = 0;
  const body: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const fenceMatch = trimmed.match(/^(`{3,}|~{3,})/);

    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        fenceMarker = fenceMatch[1][0];
      } else if (fenceMarker && trimmed.startsWith(fenceMarker.repeat(3))) {
        inFence = false;
        fenceMarker = null;
      }

      if (collecting) {
        body.push(line);
      }

      continue;
    }

    if (!inFence) {
      const headingMatch = line.match(/^(#{1,6})\s+(.+?)\s*$/);

      if (headingMatch) {
        const level = headingMatch[1].length;
        const label = stripInlineMarkdown(headingMatch[2]).toLowerCase();

        if (collecting && level <= sectionLevel) {
          break;
        }

        if (!collecting && label === heading.toLowerCase()) {
          collecting = true;
          sectionLevel = level;
          continue;
        }
      }
    }

    if (collecting) {
      body.push(line);
    }
  }

  const section = body.join("\n").trim();
  return section || null;
}

function extractFirstHeading(markdown: string, expectedLevel: number) {
  const lines = markdown.split(/\r?\n/);
  let inFence = false;
  let fenceMarker: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    const fenceMatch = trimmed.match(/^(`{3,}|~{3,})/);

    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        fenceMarker = fenceMatch[1][0];
      } else if (fenceMarker && trimmed.startsWith(fenceMarker.repeat(3))) {
        inFence = false;
        fenceMarker = null;
      }

      continue;
    }

    if (inFence) {
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+?)\s*$/);

    if (headingMatch && headingMatch[1].length === expectedLevel) {
      return headingMatch[2];
    }
  }

  return null;
}

export function firstMeaningfulLine(input: string | null | undefined) {
  return (
    input
      ?.split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .find((line) => !line.startsWith("-")) ?? null
  );
}

function normalizeMarkdownStatus(input: string | null): WorkItemStatus | null {
  const normalized = normalizeScalarToken(input);

  return isAdminRepoWorkItemStatus(normalized) ? normalized : null;
}

function normalizeMarkdownItemType(input: string | null): MarkdownItemType | null {
  const normalized = normalizeScalarToken(input);
  return isAdminRepoWorkItemType(normalized) ? normalized : null;
}

export function mapMarkdownTypeToAdminItemType(
  input: MarkdownItemType | null,
): AdminItemType | null {
  switch (input) {
    case "bug":
    case "change_request":
    case "context_capture":
      return input;
    case "plan":
    case "frontend_spec":
    case "product_brief":
      return "context_capture";
    case null:
      return null;
  }
}

function normalizeMarkdownPriority(input: string | null): AdminPriority | null {
  const normalized = normalizeScalarToken(input);
  return isAdminRepoWorkItemPriority(normalized) ? normalized : null;
}

function normalizeMarkdownOwner(input: string | null): AdminRepoWorkItemOwner | null {
  const normalized = normalizeScalarToken(input);
  return isAdminRepoWorkItemOwner(normalized) ? normalized : null;
}

function normalizeMarkdownArchiveIntent(
  input: string | null,
): AdminRepoWorkItemArchiveIntent | null {
  const normalized = normalizeScalarToken(input);
  return isAdminRepoWorkItemArchiveIntent(normalized) ? normalized : null;
}

function normalizeMarkdownFrontendLane(input: string | null): AdminRepoWorkItemFrontendLane | null {
  const normalized = normalizeScalarToken(input);
  return isAdminRepoWorkItemFrontendLane(normalized) ? normalized : null;
}

function normalizeCanonicalMarkdownRole(input: string | null): TargetRole | null {
  const normalized = normalizeScalarToken(input);

  if (adminCaptureTargetRoles.includes(normalized as TargetRole)) {
    return normalized as TargetRole;
  }

  return null;
}

function normalizeSlug(input: string | null) {
  const value = stripInlineMarkdown(input ?? "").trim();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ? value : null;
}

function extractPromptRole(prompt: string): TargetRole | null {
  const firstLine = prompt
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  const match = firstLine?.match(/^ROLE:\s*([a-z][a-z _-]*)$/i);
  return match ? normalizeRole(match[1]) : null;
}

function normalizeScalarToken(input: string | null) {
  return (input ?? "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[*~]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s-]+/g, "_");
}

function extractFencedPrompt(input: string) {
  const trimmed = input.trim();
  const match = trimmed.match(/^(`{3,}|~{3,})[a-zA-Z0-9_-]*\s*\n([\s\S]*?)\n\1$/);
  return match ? truncate(match[2].trim(), MAX_NOTE_LENGTH) : null;
}

function formatMarkdownRole(role: TargetRole) {
  return role.replace(/_/g, " ");
}

export function jsonValuesEqual(left: Json | undefined, right: Json | undefined) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

export function stripMarkdown(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^[\s*-]*\[[ xX-]]\s+/gm, "")
    .replace(/^[\s*-]+\s+/gm, "")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2600);
}

function stripInlineMarkdown(input: string) {
  return input
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[*_~]/g, "")
    .trim();
}

export function titleFromFilename(sourcePath: string) {
  return path
    .basename(sourcePath, ".md")
    .replace(/^\d{4}-\d{2}-\d{2}-/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function normalizeSourcePath(input: string) {
  return input.split(path.sep).join("/");
}

function normalizeRole(input: string): TargetRole | null {
  const normalized = input.toLowerCase().replace(/[\s-]+/g, "_");

  if (adminCaptureTargetRoles.includes(normalized as TargetRole)) {
    return normalized as TargetRole;
  }

  return null;
}

export function normalizeMetadata(value: Json | undefined): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json | undefined>)
    : {};
}

export function sourceKey(sourceType: string, sourcePath: string) {
  return `${sourceType}:${sourcePath}`;
}

export function workItemIdentityKey(
  workItemId: string | null | undefined,
  sourceType: string,
  sourcePath: string,
) {
  return workItemId ? `work-item-id:${workItemId}` : sourceKey(sourceType, sourcePath);
}

export function truncate(input: string, maxLength: number) {
  return input.length > maxLength ? `${input.slice(0, maxLength - 3)}...` : input;
}

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
