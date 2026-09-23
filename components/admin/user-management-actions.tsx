"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  KeyIcon,
  PencilSimpleIcon,
  SpinnerGapIcon,
  TrashIcon,
  WarningIcon,
} from "@phosphor-icons/react";

import {
  deleteStaffAction,
  resetStaffPasswordAction,
  updateStaffAction,
  type StaffActionState,
} from "@/app/actions/users";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { toast } from "@/components/ui/toast";

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
  hasClinicalHistory: boolean;
};

const emptyState: StaffActionState = { success: false, message: "" };

function showSuccess(message: string) {
  toast.add({
    title: "Perubahan tersimpan",
    description: message,
    type: "success",
  });
}

export function UserManagementActions({
  user,
  currentUserId,
}: {
  user: ManagedUser;
  currentUserId: string;
}) {
  const router = useRouter();
  const id = useId();
  const isCurrentUser = user.id === currentUserId;
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editState, setEditState] = useState(emptyState);
  const [passwordState, setPasswordState] = useState(emptyState);
  const [deleteState, setDeleteState] = useState(emptyState);
  const [editPending, startEditTransition] = useTransition();
  const [passwordPending, startPasswordTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();

  function submitEdit(formData: FormData) {
    startEditTransition(async () => {
      const result = await updateStaffAction(user.id, formData);
      setEditState(result);
      if (result.success) {
        setEditOpen(false);
        showSuccess(result.message);
        router.refresh();
      }
    });
  }

  function submitPassword(formData: FormData) {
    startPasswordTransition(async () => {
      const result = await resetStaffPasswordAction(user.id, formData);
      setPasswordState(result);
      if (result.success) {
        setPasswordOpen(false);
        toast.add({
          title: "Kata sandi diatur ulang",
          description: result.message,
          type: "success",
        });
      }
    });
  }

  function confirmDelete() {
    startDeleteTransition(async () => {
      const result = await deleteStaffAction(user.id);
      setDeleteState(result);
      if (result.success) {
        setDeleteOpen(false);
        toast.add({
          title: "Akun dihapus",
          description: result.message,
          type: "success",
        });
        router.refresh();
      }
    });
  }

  const deleteDisabled = isCurrentUser || user.hasClinicalHistory;
  const deleteReason = isCurrentUser
    ? "Akun yang sedang digunakan tidak dapat dihapus."
    : user.hasClinicalHistory
      ? "Akun dengan riwayat klinis tidak dapat dihapus."
      : "Hapus pengguna";

  return (
    <div className="flex items-center justify-end gap-1">
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (open) setEditState(emptyState);
        }}
      >
        <DialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Ubah pengguna ${user.name}`}
            />
          }
        >
          <PencilSimpleIcon />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah pengguna</DialogTitle>
            <DialogDescription>
              Perbarui identitas dan tingkat akses {user.name}.
            </DialogDescription>
          </DialogHeader>
          <form action={submitEdit} className="flex flex-col gap-4">
            <FieldGroup>
              <Field data-invalid={Boolean(editState.errors?.name)}>
                <FieldLabel htmlFor={`${id}-name`}>Nama lengkap</FieldLabel>
                <Input
                  id={`${id}-name`}
                  name="name"
                  defaultValue={user.name}
                  aria-invalid={Boolean(editState.errors?.name)}
                  required
                />
                <FieldError>{editState.errors?.name}</FieldError>
              </Field>
              <Field data-invalid={Boolean(editState.errors?.email)}>
                <FieldLabel htmlFor={`${id}-email`}>Email dinas</FieldLabel>
                <Input
                  id={`${id}-email`}
                  name="email"
                  type="email"
                  defaultValue={user.email}
                  aria-invalid={Boolean(editState.errors?.email)}
                  required
                />
                <FieldError>{editState.errors?.email}</FieldError>
              </Field>
              <Field data-invalid={Boolean(editState.errors?.role)}>
                <FieldLabel htmlFor={`${id}-role`}>Peran</FieldLabel>
                <NativeSelect
                  className="w-full"
                  id={`${id}-role`}
                  name="role"
                  defaultValue={user.role}
                  disabled={isCurrentUser}
                  aria-invalid={Boolean(editState.errors?.role)}
                >
                  <NativeSelectOption value="STAFF">Staf klinis</NativeSelectOption>
                  <NativeSelectOption value="ADMIN">Administrator</NativeSelectOption>
                </NativeSelect>
                {isCurrentUser ? (
                  <>
                    <input type="hidden" name="role" value={user.role} />
                    <FieldDescription>
                      Peran akun sendiri tidak dapat diubah dari halaman ini.
                    </FieldDescription>
                  </>
                ) : null}
                <FieldError>{editState.errors?.role}</FieldError>
              </Field>
            </FieldGroup>
            {editState.message && !editState.success ? (
              <p className="text-sm text-destructive" aria-live="polite">
                {editState.message}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={editPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={editPending}>
                {editPending ? (
                  <SpinnerGapIcon
                    data-icon="inline-start"
                    className="animate-spin motion-reduce:animate-none"
                  />
                ) : null}
                {editPending ? "Menyimpan…" : "Simpan perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={passwordOpen}
        onOpenChange={(open) => {
          setPasswordOpen(open);
          if (open) setPasswordState(emptyState);
        }}
      >
        <DialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Atur ulang kata sandi ${user.name}`}
              disabled={isCurrentUser}
              title={
                isCurrentUser
                  ? "Gunakan halaman Akun saya untuk mengubah kata sandi."
                  : "Atur ulang kata sandi"
              }
            />
          }
        >
          <KeyIcon />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atur ulang kata sandi</DialogTitle>
            <DialogDescription>
              Buat kata sandi sementara untuk {user.name}. Seluruh sesi aktifnya
              akan diakhiri.
            </DialogDescription>
          </DialogHeader>
          <form action={submitPassword} className="flex flex-col gap-4">
            <FieldGroup>
              <Field data-invalid={Boolean(passwordState.errors?.password)}>
                <FieldLabel htmlFor={`${id}-password`}>
                  Kata sandi baru
                </FieldLabel>
                <Input
                  id={`${id}-password`}
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={10}
                  aria-invalid={Boolean(passwordState.errors?.password)}
                  required
                />
                <FieldDescription>Minimal 10 karakter.</FieldDescription>
                <FieldError>{passwordState.errors?.password}</FieldError>
              </Field>
              <Field
                data-invalid={Boolean(passwordState.errors?.confirmPassword)}
              >
                <FieldLabel htmlFor={`${id}-confirm-password`}>
                  Ulangi kata sandi
                </FieldLabel>
                <Input
                  id={`${id}-confirm-password`}
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={10}
                  aria-invalid={Boolean(
                    passwordState.errors?.confirmPassword,
                  )}
                  required
                />
                <FieldError>
                  {passwordState.errors?.confirmPassword}
                </FieldError>
              </Field>
            </FieldGroup>
            {passwordState.message && !passwordState.success ? (
              <p className="text-sm text-destructive" aria-live="polite">
                {passwordState.message}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordOpen(false)}
                disabled={passwordPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={passwordPending}>
                {passwordPending ? (
                  <SpinnerGapIcon
                    data-icon="inline-start"
                    className="animate-spin motion-reduce:animate-none"
                  />
                ) : (
                  <KeyIcon data-icon="inline-start" />
                )}
                {passwordPending ? "Mengatur…" : "Atur ulang"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Hapus pengguna ${user.name}`}
        disabled={deleteDisabled}
        title={deleteReason}
        onClick={() => {
          setDeleteState(emptyState);
          setDeleteOpen(true);
        }}
      >
        <TrashIcon />
      </Button>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <WarningIcon />
            </AlertDialogMedia>
            <AlertDialogTitle>Hapus akun {user.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Akun, sesi, dan kredensial masuk akan dihapus permanen. Tindakan
              ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteState.message && !deleteState.success ? (
            <p className="text-sm text-destructive" aria-live="polite">
              {deleteState.message}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>Batal</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deletePending}
            >
              {deletePending ? (
                <SpinnerGapIcon
                  data-icon="inline-start"
                  className="animate-spin motion-reduce:animate-none"
                />
              ) : (
                <TrashIcon data-icon="inline-start" />
              )}
              {deletePending ? "Menghapus…" : "Hapus akun"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
