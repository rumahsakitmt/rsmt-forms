import { FormFiller } from "@/components/forms/form-filler";
import { getFormDefinition } from "@/lib/data/forms";

export default async function NewFormPage({ params }: PageProps<"/forms/[slug]/new">) {
  const { slug } = await params;
  const form = await getFormDefinition(slug);

  return (
    <FormFiller
      formSlug={form.slug}
      schema={form.currentVersion.schema}
      version={form.currentVersion.version}
    />
  );
}
