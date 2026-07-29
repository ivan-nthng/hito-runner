import { useState } from "react";

import { HitoDsPlayground } from "@/components/hito-ds/playground";
import { ProductLinks } from "@/components/hito-ds/reference";
import { EditableSelectValueField, EditableValueField } from "@/components/ui/editable-value-field";
import { Icon } from "@/components/ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type SandboxScalarField = "age" | "height" | "weight";
type SandboxEditableField = SandboxScalarField | "terrain";

const SANDBOX_DEFAULTS: Record<SandboxScalarField, string> = {
  age: "36",
  height: "",
  weight: "72",
};

const SANDBOX_FIELDS = [
  ["age", "Age", "36", 13, 100, 1, "numeric", undefined],
  ["height", "Height", "175", 120, 230, 1, "numeric", "cm"],
  ["weight", "Weight", "72", 30, 250, 0.5, "decimal", "kg"],
] as const;

const noop = () => {};

export function EditableValueFieldSandbox() {
  const [activeField, setActiveField] = useState<SandboxEditableField | null>(null);
  const [values, setValues] = useState<Record<SandboxScalarField, string>>(() => ({
    ...SANDBOX_DEFAULTS,
  }));
  const [terrain, setTerrain] = useState("road");

  const reset = () => {
    setActiveField(null);
    setValues({ ...SANDBOX_DEFAULTS });
    setTerrain("road");
  };

  return (
    <HitoDsPlayground
      id="editable-value-field"
      label="Editable Value Field"
      status="Shared control"
      statusTone="signal"
      usedIn={
        <ProductLinks
          links={[
            { href: "/", label: "Quick setup" },
            { href: "/settings", label: "/settings" },
          ]}
        />
      }
      demo={
        <div className="relative grid w-full min-w-0 justify-items-center">
          <TooltipProvider delayDuration={120}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="hito-button hito-button-ghost hito-button-xs hito-button-icon absolute right-0 top-0 z-10"
                  aria-label="Reset editable value field sandbox"
                  onClick={reset}
                >
                  <Icon name="refresh" size="xs" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" sideOffset={8}>
                <span className="hito-tooltip-meta block">Reset sandbox</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="hito-editable-value-field-group">
            {SANDBOX_FIELDS.map(
              ([fieldKey, label, placeholder, min, max, step, inputMode, unit]) => (
                <EditableValueField
                  key={fieldKey}
                  fieldKey={fieldKey}
                  label={label}
                  value={values[fieldKey]}
                  setValue={(value) => setValues((current) => ({ ...current, [fieldKey]: value }))}
                  activeEditableKey={activeField}
                  setActiveEditableKey={setActiveField}
                  placeholder={placeholder}
                  min={min}
                  max={max}
                  step={step}
                  inputMode={inputMode}
                  unit={unit}
                />
              ),
            )}
            <EditableSelectValueField
              activeEditableKey={activeField}
              emptyLabel="Add terrain"
              fieldKey="terrain"
              label="Terrain"
              options={[
                { value: "road", label: "Road" },
                { value: "trail", label: "Trail" },
                { value: "mixed", label: "Mixed" },
              ]}
              setActiveEditableKey={setActiveField}
              setValue={setTerrain}
              value={terrain}
            />
          </div>
        </div>
      }
      variants={
        <div className="grid min-w-0 gap-6">
          <div>
            <p className="hito-list-row-title">Static state reference</p>
            <p className="hito-caption mt-2">Inert examples only. Use Demo to interact.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid content-start gap-2">
              <p className="hito-micro-label">Empty / add</p>
              <div inert>
                <EditableValueField
                  fieldKey="static-empty"
                  label="Height"
                  value=""
                  setValue={noop}
                  activeEditableKey={null}
                  setActiveEditableKey={noop}
                  placeholder="175"
                  min={120}
                  max={230}
                  step={1}
                  inputMode="numeric"
                  unit="cm"
                />
              </div>
            </div>
            <div className="grid content-start gap-2">
              <p className="hito-micro-label">Saved</p>
              <div inert>
                <EditableValueField
                  fieldKey="static-saved"
                  label="Age"
                  value="36"
                  setValue={noop}
                  activeEditableKey={null}
                  setActiveEditableKey={noop}
                  placeholder="36"
                  min={13}
                  max={100}
                  step={1}
                  inputMode="numeric"
                />
              </div>
            </div>
            <div className="grid content-start gap-2">
              <p className="hito-micro-label">Invalid readback</p>
              <div inert>
                <EditableValueField
                  fieldKey="static-invalid"
                  label="Weight"
                  value="12"
                  setValue={noop}
                  activeEditableKey={null}
                  setActiveEditableKey={noop}
                  placeholder="72"
                  min={30}
                  max={250}
                  step={0.5}
                  inputMode="decimal"
                  unit="kg"
                />
              </div>
            </div>
            <div className="grid content-start gap-2">
              <p className="hito-micro-label">Hover visual reference</p>
              <div inert>
                <EditableValueField
                  fieldKey="static-hover"
                  label="Weight"
                  value="72"
                  setValue={noop}
                  activeEditableKey={null}
                  setActiveEditableKey={noop}
                  placeholder="72"
                  min={30}
                  max={250}
                  step={0.5}
                  inputMode="decimal"
                  unit="kg"
                  demoState="hover"
                />
              </div>
            </div>
            <div className="grid content-start gap-2 sm:col-span-2">
              <p className="hito-micro-label">Editing / compact field and commit</p>
              <div inert>
                <EditableValueField
                  fieldKey="static-editing"
                  label="Height"
                  value="175"
                  setValue={noop}
                  activeEditableKey="static-editing"
                  setActiveEditableKey={noop}
                  placeholder="175"
                  min={120}
                  max={230}
                  step={1}
                  inputMode="numeric"
                  unit="cm"
                />
              </div>
            </div>
          </div>
        </div>
      }
      controls={
        <div className="hito-row-group border-0">
          <div className="hito-list-row items-start">
            <div>
              <p className="hito-list-row-title">States</p>
              <p className="hito-list-row-copy">
                Height starts empty. Hover or focus any field to edit.
              </p>
            </div>
          </div>
          <div className="hito-list-row items-start">
            <div>
              <p className="hito-list-row-title">Interaction</p>
              <p className="hito-list-row-copy">
                Enter or check saves. Escape cancels. Tab advances. Clear removes.
              </p>
            </div>
          </div>
          <div className="hito-list-row items-start">
            <div>
              <p className="hito-list-row-title">Validation</p>
              <p className="hito-list-row-copy">
                Try Age outside 13–100. Invalid drafts stay open; reset stays local.
              </p>
            </div>
          </div>
        </div>
      }
    />
  );
}
