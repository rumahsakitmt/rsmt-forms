"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  SpinnerGapIcon,
  TrashIcon,
  WarningIcon,
} from "@phosphor-icons/react";

import {
  deleteSubmissionAction,
  type DeleteSubmissionResult,
} from "@/app/actions/submissions";
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

const emptyResult: DeleteSubmissionResult = { success: false, message: "" };

type SubmissionDeleteButtonProps = {
  submissionId: string;
  patientName: string;
  formTitle: string;
  redirectTo?: string;
  showLabel?: boolean;
};

export function SubmissionDeleteButton({
  submissionId,
  patientName,
  formTitle,
  redirectTo,
  showLabel = false,
}: SubmissionDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState(emptyResult);
  const [pending, startTransition] = useTransition();
  const displayName = patientName || "tanpa nama";

  function confirmDelete() {
    startTransition(async () => {
      const nextResult = await deleteSubmissionAction(submissionId);
      setResult(nextResult);

      if (nextResult.success) {
        setOpen(false);
        toast.add({
          title: "Formulir dihapus",
          description: nextResult.message,
          type: "success",
        });
        if (redirectTo) router.push(redirectTo);
        else router.refresh();
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant={showLabel ? "destructive" : "ghost"}
        size={showLabel ? "default" : "icon"}
        aria-label={`Hapus formulir ${displayName}`}
        onClick={() => {
          setResult(emptyResult);
          setOpen(true);
        }}
      >
        <TrashIcon data-icon={showLabel ? "inline-start" : undefined} />
        {showLabel ? "Hapus" : null}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <WarningIcon />
            </AlertDialogMedia>
            <AlertDialogTitle>Hapus formulir {displayName}?</AlertDialogTitle>
            <AlertDialogDescription>
              {formTitle} beserta seluruh jawabannya akan dihapus permanen.
              Tindakan ini tidak dapat dibatalkan.
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
              {pending ? "Menghapus…" : "Hapus permanen"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
