import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient, type Prisma } from "../lib/generated/prisma/client";

import { assessmentSchema } from "../lib/forms/assessment-schema";

const connectionString = process.env.DATABASE_URL_POOLED;

if (!connectionString) {
  throw new Error("DATABASE_URL_POOLED belum diatur.");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

async function main() {
  const form = await prisma.form.upsert({
    where: { slug: "assessment-edukasi-pasien" },
    update: {
      title: assessmentSchema.title,
      description: assessmentSchema.description,
      category: "Edukasi Pasien",
      icon: "heart-handshake",
      isActive: true,
    },
    create: {
      slug: "assessment-edukasi-pasien",
      title: assessmentSchema.title,
      description: assessmentSchema.description,
      category: "Edukasi Pasien",
      icon: "heart-handshake",
      isActive: true,
    },
  });

  const version = await prisma.formVersion.upsert({
    where: { formId_version: { formId: form.id, version: 1 } },
    update: {},
    create: {
      formId: form.id,
      version: 1,
      schemaJson: assessmentSchema as unknown as Prisma.InputJsonValue,
      publishedAt: new Date(),
    },
  });

  await prisma.form.update({
    where: { id: form.id },
    data: { currentVersionId: version.id },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
