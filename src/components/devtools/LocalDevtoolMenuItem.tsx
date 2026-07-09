import { DropdownMenuCheckboxItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useLocalUiInspectorToggle } from "@/components/devtools/local-devtool-gate";

export function LocalDevtoolMenuItem({
  itemClassName,
  separatorClassName,
}: {
  itemClassName?: string;
  separatorClassName?: string;
}) {
  const localDevtool = useLocalUiInspectorToggle();

  if (!localDevtool.available) return null;

  return (
    <>
      <DropdownMenuCheckboxItem
        checked={localDevtool.enabled}
        className={itemClassName}
        onCheckedChange={(checked) => {
          localDevtool.setEnabled(checked === true);
        }}
        onSelect={(event) => event.preventDefault()}
      >
        <span className="min-w-0 flex-1">Dev tool</span>
        <span className="hito-menu-meta ml-auto">{localDevtool.enabled ? "On" : "Off"}</span>
      </DropdownMenuCheckboxItem>
      <DropdownMenuSeparator className={separatorClassName} />
    </>
  );
}
