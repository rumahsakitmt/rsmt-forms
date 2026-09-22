"use client";

import { useState } from "react";
import { IconKey, IconLoader2 } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export function ChangePasswordForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const currentPassword = String(values.get("currentPassword"));
    const newPassword = String(values.get("newPassword"));
    const confirmation = String(values.get("confirmation"));

    setSuccess(false);
    if (newPassword !== confirmation) {
      setMessage("Konfirmasi kata sandi tidak sama.");
      return;
    }

    setPending(true);
    setMessage("");
    const result = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    setPending(false);

    if (result.error) {
      setMessage("Kata sandi saat ini tidak sesuai atau kata sandi baru belum memenuhi syarat.");
      return;
    }

    form.reset();
    setSuccess(true);
    setMessage("Kata sandi berhasil diperbarui. Sesi lain telah dikeluarkan.");
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <Field><FieldLabel htmlFor="currentPassword">Kata sandi saat ini</FieldLabel><Input className="h-11 bg-card" id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required /></Field>
      <Field><FieldLabel htmlFor="newPassword">Kata sandi baru</FieldLabel><Input className="h-11 bg-card" id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={10} required /><FieldDescription>Minimal 10 karakter.</FieldDescription></Field>
      <Field><FieldLabel htmlFor="confirmation">Ulangi kata sandi baru</FieldLabel><Input className="h-11 bg-card" id="confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={10} required /></Field>
      {message ? success ? <p className="save-message" role="status">{message}</p> : <FieldError>{message}</FieldError> : null}
      <Button className="h-10 w-fit px-4" disabled={pending} type="submit">
        {pending ? <IconLoader2 className="spin" size={18} /> : <IconKey size={18} />}
        {pending ? "Memperbarui…" : "Perbarui kata sandi"}
      </Button>
    </form>
  );
}
