import { Separator } from "@/components/ui/separator";

export function Header() {
  return (
    <div className="space-y-1">
      <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-4xl">
        QPX vs TANGO Tax Comparator
      </h1>
      <div className="text-muted-foreground text-sm space-y-1">
        <p>
          Compare tax responses between <strong>QPX (XML)</strong> and{" "}
          <strong>TANGO (JSON)</strong>.
        </p>
        <p className="text-muted-foreground/70">
          <strong>Scope (MVP):</strong> One-way, 1 Adult (ADT), Non-stop, Manual
          paste comparison
        </p>
      </div>
      <Separator className="my-4" />
    </div>
  );
}
