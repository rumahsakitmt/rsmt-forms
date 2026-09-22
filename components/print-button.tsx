"use client";

import { IconPrinter } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button className="no-print h-10 px-4" type="button" onClick={() => window.print()}>
      <IconPrinter size={18} /> Cetak formulir
    </Button>
  );
}
