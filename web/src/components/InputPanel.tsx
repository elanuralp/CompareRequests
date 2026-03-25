import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface InputPanelProps {
  qpxInput: string;
  tangoInput: string;
  onQpxChange: (value: string) => void;
  onTangoChange: (value: string) => void;
}

export function InputPanel({
  qpxInput,
  tangoInput,
  onQpxChange,
  onTangoChange,
}: InputPanelProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="qpx-input">QPX XML Response</Label>
        <Textarea
          id="qpx-input"
          placeholder="<response>...</response>"
          value={qpxInput}
          onChange={(e) => onQpxChange(e.target.value)}
          className="min-h-[300px] font-mono text-xs"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tango-input">TANGO JSON Response</Label>
        <Textarea
          id="tango-input"
          placeholder='{"taxCalculationSearchResult": [...]}'
          value={tangoInput}
          onChange={(e) => onTangoChange(e.target.value)}
          className="min-h-[300px] font-mono text-xs"
        />
      </div>
    </div>
  );
}
