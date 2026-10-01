-- AlterTable
ALTER TABLE "submission" ADD COLUMN "patientDetailsJson" JSONB NOT NULL DEFAULT '{}';
