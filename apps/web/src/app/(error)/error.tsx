"use client"; // Error boundaries must be Client Components

import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import PDFError from "@/components/layout/pdf/pdf-error";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-row items-center justify-center gap-4">
      <PDFError message={parseCatchError(error)} title="Unexpected Error" />
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
