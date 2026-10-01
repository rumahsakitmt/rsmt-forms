import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import type { IdentityField } from "./types";

export function formatIdentityValue(field: IdentityField, value: string | undefined) {
  if (!value) return "";
  if (field.type !== "date") return value;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : format(date, "dd MMMM yyyy", { locale: idLocale });
}
