import { useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { FileJson2, Upload, CheckCircle2 } from "lucide-react";
import {
  FUTURE_TEMPLATE_VERSION,
  LEGACY_IMPORT_ITEM_KEYS,
  LEGACY_IMPORT_ROOT_KEYS,
  summarizeImportedPlan,
  type ImportedPlan,
  validateImportedPlanJson,
} from "@/lib/imported-plan";
import { completeOnboarding } from "@/lib/training-api";

export function OnboardingGate() {
  const router = useRouter();
  const completeOnboardingFn = useServerFn(completeOnboarding);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [jsonDraft, setJsonDraft] = useState("");
  const [importedPlan, setImportedPlan] = useState<ImportedPlan | null>(null);
  const [status, setStatus] = useState<"idle" | "parsing" | "saving" | "finishing">("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  const isBusy = status !== "idle";
  const validateJsonDraft = validateJsonDraftFactory({
    setError,
    setFieldErrors,
    setImportedPlan,
    setStatus,
  });

  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-hairline bg-gradient-to-br from-surface-elevated to-surface p-6 lg:p-10">
      <div className="max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            JSON onboarding
          </p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            First import
          </p>
        </div>
        <h1 className="mt-3 font-display text-4xl lg:text-5xl leading-[1.05]">
          Import your first training week
        </h1>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          Upload one JSON file with your plan structure. We will validate the shape, create your
          saved calendar from that data, and keep the existing weekly-plan baseline intact.
        </p>
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-hairline bg-background/35 p-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Current supported import
          </div>
          <div className="mt-3 space-y-2 text-sm text-foreground/85">
            <p>Root keys: {LEGACY_IMPORT_ROOT_KEYS.join(" · ")}</p>
            <p>Each workout item: {LEGACY_IMPORT_ITEM_KEYS.join(" · ")}</p>
          </div>
        </div>
        <div className="rounded-xl border border-hairline bg-background/35 p-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Future template direction
          </div>
          <p className="mt-2 text-sm text-foreground/85 leading-relaxed">
            The later <span className="font-medium">{FUTURE_TEMPLATE_VERSION}</span> template will
            support preparation horizon metadata and more detailed workout segments. This first
            setup flow still imports the simpler week-preview shape today. JSON export of your saved
            trainings comes later.
          </p>
        </div>
      </div>

      <form
        className="mt-10 grid gap-6"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);

          if (!importedPlan) {
            setError("Upload a valid JSON file before creating your calendar.");
            return;
          }

          setStatus("saving");

          try {
            await completeOnboardingFn({
              data: {
                importedPlan,
              },
            });
            setStatus("finishing");
            await router.invalidate();
          } catch (submitError) {
            setStatus("idle");
            setError(
              submitError instanceof Error
                ? submitError.message
                : "Could not create your calendar.",
            );
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            setImportedPlan(null);
            setFieldErrors([]);
            setError(null);

            if (!file) {
              setSelectedFileName(null);
              return;
            }

            setSelectedFileName(file.name);

            try {
              const raw = await file.text();
              setJsonDraft(raw);
              validateJsonDraft(raw);
            } catch (parseError) {
              setFieldErrors([]);
              setStatus("idle");
              setError(
                parseError instanceof Error
                  ? "The file could not be read as valid JSON."
                  : "The file could not be read as valid JSON.",
              );
            }
          }}
        />

        <div className="rounded-xl border border-dashed border-hairline bg-background/30 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-md bg-signal px-5 py-2.5 text-sm font-medium text-signal-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {selectedFileName ? "Choose another JSON" : "Upload JSON"}
            </button>
            <span className="text-sm text-muted-foreground">
              {selectedFileName ?? "No file selected yet"}
            </span>
          </div>
          <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            We validate the uploaded shape before creating the saved plan.
          </p>
        </div>

        <label className="grid gap-2">
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            JSON content
          </span>
          <textarea
            rows={12}
            value={jsonDraft}
            onChange={(event) => {
              setJsonDraft(event.target.value);
              setImportedPlan(null);
              setFieldErrors([]);
              setError(null);
            }}
            placeholder='Paste or edit your JSON here. Example root keys: {"plan_name": "...", "generated_for": "...", "start_date": "...", "week_1_preview": [...]}'
            className="rounded-lg border border-hairline bg-background/50 px-4 py-3 font-mono text-xs leading-relaxed placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30 resize-y"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={isBusy || !jsonDraft.trim()}
            onClick={() => validateJsonDraft(jsonDraft)}
            className="rounded-md border border-hairline px-5 py-2.5 text-sm transition-colors hover:bg-accent disabled:opacity-60"
          >
            Validate JSON
          </button>
          <span className="text-[11px] text-muted-foreground">
            File upload fills this editor, and you can also paste or adjust the template manually.
          </span>
        </div>

        {importedPlan && (
          <div className="rounded-xl border border-success/20 bg-success/10 p-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-success">
              <CheckCircle2 className="h-3.5 w-3.5" />
              JSON ready
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm text-foreground/85">
              <p>Plan: {summarizeImportedPlan(importedPlan).planName}</p>
              <p>For: {summarizeImportedPlan(importedPlan).generatedFor}</p>
              <p>Start date: {importedPlan.start_date}</p>
              <p>Week items: {summarizeImportedPlan(importedPlan).days}</p>
            </div>
          </div>
        )}

        {fieldErrors.length > 0 && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-destructive">
              JSON shape mismatch
            </div>
            <div className="mt-3 space-y-2 text-sm text-foreground/85">
              {fieldErrors.slice(0, 5).map((issue) => (
                <p key={issue}>{issue}</p>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-foreground/85">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-hairline bg-background/35 p-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <FileJson2 className="h-3.5 w-3.5 text-signal" />
            What happens next
          </div>
          <p className="mt-2 text-sm text-foreground/85 leading-relaxed">
            After a valid import we create one saved plan cycle and open the existing calendar and
            workout routes with your imported week as the visible source of truth.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-hairline pt-6">
          <button
            type="submit"
            disabled={isBusy || !importedPlan}
            className="rounded-md bg-signal px-5 py-2.5 text-sm font-medium text-signal-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {status === "parsing"
              ? "Checking JSON..."
              : status === "saving"
                ? "Creating calendar..."
                : status === "finishing"
                  ? "Opening your plan..."
                  : "Create my calendar"}
          </button>
          <span className="text-[11px] text-muted-foreground">
            Import first. JSON export arrives later as a separate saved-mode capability.
          </span>
        </div>

        {status === "finishing" && (
          <p className="text-sm text-foreground/80">
            Your JSON was accepted. Loading the saved weekly plan now…
          </p>
        )}
      </form>
    </section>
  );
}

function formatIssue(path: (string | number)[], message: string) {
  if (!path.length) {
    return message;
  }

  return `${path.join(".")}: ${message}`;
}

function validateJsonDraftFactory({
  setError,
  setFieldErrors,
  setImportedPlan,
  setStatus,
}: {
  setError: (value: string | null) => void;
  setFieldErrors: (value: string[]) => void;
  setImportedPlan: (value: ImportedPlan | null) => void;
  setStatus: (value: "idle" | "parsing" | "saving" | "finishing") => void;
}) {
  return function validateJsonDraft(raw: string) {
    setStatus("parsing");
    setError(null);
    setFieldErrors([]);
    setImportedPlan(null);

    const validation = validateImportedPlanJson(raw);

    if (!validation) {
      setStatus("idle");
      setError("The JSON content could not be parsed.");
      return;
    }

    if (!validation.success) {
      setFieldErrors(
        validation.error.issues.map((issue) => formatIssue(issue.path, issue.message)),
      );
      setStatus("idle");
      return;
    }

    setImportedPlan(validation.data);
    setStatus("idle");
  };
}
