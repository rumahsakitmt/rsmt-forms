"use client";

import Link from "next/link";
import { SignatureIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";

import { useState } from "react";
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export function FormCatalog({ forms }: { forms: { id: string; slug: string; title: string; description: string | null; category: string }[] }) {
  const [query, setQuery] = useState("");
  const terms = query.trim().toLocaleLowerCase("id").split(/\s+/).filter(Boolean);
  const filteredForms = forms.filter((form) => {
    const text = `${form.title} ${form.description ?? ""} ${form.category}`.toLocaleLowerCase("id");
    return terms.every((term) => text.includes(term));
  });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <section className="flex flex-col gap-2">
        <div className="flex items-end justify-between gap-4 [&_h1]:text-xl [&_h1]:font-semibold">
          <h1>Formulir klinis</h1>
          <span className="text-sm text-muted-foreground">
            {filteredForms.length} formulir
          </span>
        </div>

        <InputGroup className="mt-4 max-w-xl">
          <InputGroupInput type="search" aria-label="Cari formulir" placeholder="Cari nama atau kategori formulir..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <InputGroupAddon><MagnifyingGlassIcon /></InputGroupAddon>
        </InputGroup>
        <p className="sr-only" role="status">{filteredForms.length} formulir ditemukan</p>
        {filteredForms.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Tidak ada formulir yang ditemukan. Coba kata kunci lain.</p>}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {filteredForms.map((form) => (
            <Card key={form.id}>
              <CardHeader>
                <CardTitle>{form.title}</CardTitle>
                <CardDescription>{form.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="outline">{form.category}</Badge>
              </CardContent>
              <CardFooter>
                <Button
                  nativeButton={false}
                  role="link"
                  size="lg"
                  render={<Link href={`/forms/${form.slug}/new`} />}
                >
                  <SignatureIcon data-icon="inline-start" />
                  Isi formulir
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
