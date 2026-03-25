import { useState, useCallback, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface InputPanelProps {
  qpxInput: string;
  tangoInput: string;
  onQpxChange: (value: string) => void;
  onTangoChange: (value: string) => void;
}

function DraggableTextarea({
  label,
  id,
  placeholder,
  value,
  onChange,
  accept,
}: {
  label: string;
  id: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  accept: string;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        const fileAccept = accept.split(",").map((a) => a.trim());
        const ext = "." + file.name.split(".").pop()?.toLowerCase();
        if (fileAccept.some((a) => a === ext || a === "*")) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const content = event.target?.result as string;
            onChange(content);
          };
          reader.readAsText(file);
        }
      }
    },
    [accept, onChange]
  );

  return (
    <div className="space-y-2 relative">
      <Label htmlFor={id}>{label}</Label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative"
      >
        <Textarea
          ref={textareaRef}
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "min-h-[300px] font-mono text-xs transition-colors",
            isDragging && "border-primary border-2"
          )}
        />
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 rounded-lg pointer-events-none">
            <div className="text-center">
              <div className="text-lg font-medium text-primary">Drop here</div>
              <div className="text-sm text-muted-foreground">
                {accept === ".xml,.txt" ? "XML files" : "JSON files"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function InputPanel({
  qpxInput,
  tangoInput,
  onQpxChange,
  onTangoChange,
}: InputPanelProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <DraggableTextarea
        label="QPX XML Response"
        id="qpx-input"
        placeholder="<response>...</response>"
        value={qpxInput}
        onChange={onQpxChange}
        accept=".xml,.txt"
      />
      <DraggableTextarea
        label="TANGO JSON Response"
        id="tango-input"
        placeholder='{"taxCalculationSearchResult": [...]}'
        value={tangoInput}
        onChange={onTangoChange}
        accept=".json,.txt"
      />
    </div>
  );
}
