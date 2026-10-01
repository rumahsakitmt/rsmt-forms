"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowCounterClockwiseIcon,
  PencilSimpleIcon,
  SpinnerGapIcon,
  TrashIcon,
  WarningIcon,
} from "@phosphor-icons/react";

import {
  deleteFormAction,
  setFormActiveAction,
  type DeleteFormResult,
} from "@/app/actions/forms";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

const emptyResult: DeleteFormResult = { success: false, message: "" };

type FormManagementActionsProps = {
  formId: string;
  formTitle: string;
  isActive: boolean;
  submissionCount: number;
  redirectTo?: string;
};

export function FormManagementActions({
  formId,
  formTitle,
  isActive,
  submissionCount,
  redirectTo,
}: FormManagementActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState(emptyResult);
  const [pending, startTransition] = useTransition();
  const willArchive = submissionCount > 0;

  function confirmDelete() {
    startTransition(async () => {
      const nextResult = await deleteFormAction(formId);
      setResult(nextResult);
      if (!nextResult.success) return;
      setOpen(false);
      toast.add({
        title: nextResult.archived ? "Formulir dinonaktifkan" : "Formulir dihapus",
        description: nextResult.message,
        type: "success",
      });
      if (redirectTo && !nextResult.archived) router.push(redirectTo);
      else router.refresh();
    });
  }

  function reactivate() {
    startTransition(async () => {
      const nextResult = await setFormActiveAction(formId, true);
      toast.add({
        title: nextResult.success ? "Formulir aktif" : "Gagal mengaktifkan",
        description: nextResult.message,
        type: nextResult.success ? "success" : "error",
      });
      if (nextResult.success) router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        nativeButton={false}
        role="link"
        variant="outline"
        render={<Link href={`/admin/forms/${formId}/edit`} />}
      >
        <PencilSimpleIcon data-icon="inline-start" />
        Edit
      </Button>
      {isActive ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Hapus formulir ${formTitle}`}
          onClick={() => {
            setResult(emptyResult);
            setOpen(true);
          }}
        >
          <TrashIcon />
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={reactivate}
        >
          <ArrowCounterClockwiseIcon data-icon="inline-start" />
          Aktifkan
        </Button>
      )}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <WarningIcon />
            </AlertDialogMedia>
            <AlertDialogTitle>
              {willArchive ? "Nonaktifkan" : "Hapus"} {formTitle}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {willArchive
                ? `Formulir ini memiliki ${submissionCount} data pasien, sehingga tidak dapat dihapus permanen. Formulir akan disembunyikan dari staf, sementara data dan laporannya tetap tersimpan.`
                : "Formulir dan seluruh versinya akan dihapus permanen. Tindakan ini tidak dapat dibatalkan."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {result.message && !result.success ? (
            <p className="text-sm text-destructive" aria-live="polite">
              {result.message}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={confirmDelete}
            >
              {pending ? (
                <SpinnerGapIcon
                  data-icon="inline-start"
                  className="animate-spin motion-reduce:animate-none"
                />
              ) : (
                <TrashIcon data-icon="inline-start" />
              )}
              {pending
                ? "Memproses…"
                : willArchive
                  ? "Nonaktifkan"
                  : "Hapus permanen"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
