import { FormCatalog } from "@/components/forms/form-catalog";
import { getActiveForms } from "@/lib/data/forms";

export default async function FormsPage() {
  const forms = await getActiveForms();
  return <FormCatalog forms={forms} />;
}
