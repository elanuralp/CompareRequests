import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/Header";
import { InputPanel } from "@/components/InputPanel";
import { ButtonRow } from "@/components/ButtonRow";
import { Summary } from "@/components/Summary";
import { DifferencesTab } from "@/components/DifferencesTab";
import { MissingTab } from "@/components/MissingTab";
import { RecordsTab } from "@/components/RecordsTab";
import { MappingTab } from "@/components/MappingTab";
import { parseQpxResponse } from "@/lib/parsers/qpxParser";
import { parseTangoResponse } from "@/lib/parsers/tangoParser";
import { compareParsedResponses } from "@/lib/comparator";
import type { ComparisonSummary, ParsedResponse } from "@/lib/types";

export function App() {
  const [qpxInput, setQpxInput] = useState("");
  const [tangoInput, setTangoInput] = useState("");
  const [result, setResult] = useState<ComparisonSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasCompared, setHasCompared] = useState(false);
  const [parsedQpx, setParsedQpx] = useState<ParsedResponse | null>(null);
  const [parsedTango, setParsedTango] = useState<ParsedResponse | null>(null);

  const handleCompare = () => {
    setError(null);
    setResult(null);
    setHasCompared(false);

    if (!qpxInput.trim()) {
      setError("Please provide QPX XML.");
      return;
    }
    if (!tangoInput.trim()) {
      setError("Please provide TANGO JSON.");
      return;
    }

    try {
      const qpx = parseQpxResponse(qpxInput);
      const tango = parseTangoResponse(tangoInput);
      const summary = compareParsedResponses(qpx, tango);
      setParsedQpx(qpx);
      setParsedTango(tango);
      setResult(summary);
      setHasCompared(true);
    } catch (e) {
      setError(String(e));
    }
  };

  const handleClear = () => {
    setQpxInput("");
    setTangoInput("");
    setResult(null);
    setError(null);
    setHasCompared(false);
    setParsedQpx(null);
    setParsedTango(null);
  };

  return (
    <div className="min-h-screen bg-background p-6 max-w-7xl mx-auto">
      <div className="space-y-6">
        <Header />

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <InputPanel
          qpxInput={qpxInput}
          tangoInput={tangoInput}
          onQpxChange={setQpxInput}
          onTangoChange={setTangoInput}
        />

        <ButtonRow onCompare={handleCompare} onClear={handleClear} />

        {hasCompared && result && (
          <>
            <Separator />
            <Summary summary={result} />
            <Tabs defaultValue="differences" className="w-full">
              <TabsList className="w-full justify-start overflow-auto">
                <TabsTrigger value="differences">Differences</TabsTrigger>
                <TabsTrigger value="missing">Missing</TabsTrigger>
                <TabsTrigger value="qpx-records">QPX Records</TabsTrigger>
                <TabsTrigger value="tango-records">TANGO Records</TabsTrigger>
                <TabsTrigger value="mapping">Mapping</TabsTrigger>
              </TabsList>

              <TabsContent value="differences" className="mt-4">
                <DifferencesTab summary={result} />
              </TabsContent>

              <TabsContent value="missing" className="mt-4">
                <MissingTab summary={result} />
              </TabsContent>

              <TabsContent value="qpx-records" className="mt-4">
                {parsedQpx && (
                  <RecordsTab records={parsedQpx.records} label="QPX" />
                )}
              </TabsContent>

              <TabsContent value="tango-records" className="mt-4">
                {parsedTango && (
                  <RecordsTab records={parsedTango.records} label="TANGO" />
                )}
              </TabsContent>

              <TabsContent value="mapping" className="mt-4">
                <MappingTab />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
