import { Button } from "@/components/ui/button";

interface ButtonRowProps {
  onCompare: () => void;
  onClear: () => void;
  disabled?: boolean;
}

export function ButtonRow({ onCompare, onClear, disabled }: ButtonRowProps) {
  return (
    <div className="flex gap-3">
      <Button onClick={onCompare} disabled={disabled} className="flex-1 sm:flex-none sm:min-w-[140px]">
        Compare
      </Button>
      <Button
        variant="outline"
        onClick={onClear}
        className="flex-1 sm:flex-none sm:min-w-[140px]"
      >
        Clear
      </Button>
    </div>
  );
}
