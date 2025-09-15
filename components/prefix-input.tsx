import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStorageString } from "@/lib/use-storage";
import { cn } from "@/lib/utils";

export function PrefixInput({
  label,
  colorDotClass,
  storageKey,
  defaultValue,
}: {
  label: string;
  colorDotClass: string;
  storageKey: string;
  defaultValue: string;
}) {
  const { value, setValue, ready } = useStorageString(storageKey, defaultValue);
  return (
    <div className="flex items-center gap-3 opacity-100">
      <div className={cn("w-3 h-3 rounded-full", colorDotClass)} />
      <Label className="min-w-20">{label}</Label>
      <Input
        value={ready ? value : ""}
        onChange={(e) => setValue(e.target.value)}
        className="flex-1"
        placeholder={`Enter ${label.toLowerCase()} prefix`}
      />
    </div>
  );
}
