"use client";

import { useState } from "react";
import { KeyIcon, SpinnerGapIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import {
  FieldGroup,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
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
      setMessage(
        "Kata sandi saat ini tidak sesuai atau kata sandi baru belum memenuhi syarat.",
      );
      return;
    }

    form.reset();
    setSuccess(true);
    setMessage("Kata sandi berhasil diperbarui. Sesi lain telah dikeluarkan.");
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="currentPassword">Kata sandi saat ini</FieldLabel>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="newPassword">Kata sandi baru</FieldLabel>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={10}
            required
          />
          <FieldDescription>Minimal 10 karakter.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirmation">Ulangi kata sandi baru</FieldLabel>
          <Input
            id="confirmation"
            name="confirmation"
            type="password"
            autoComplete="new-password"
            minLength={10}
            required
          />
        </Field>
        {message ? (
          success ? (
            <p className="text-sm text-muted-foreground" role="status">
              {message}
            </p>
          ) : (
            <FieldError>{message}</FieldError>
          )
        ) : null}
        <Button className="h-10 w-fit px-4" disabled={pending} type="submit">
          {pending ? (
            <SpinnerGapIcon
              data-icon="inline-start"
              className="animate-spin motion-reduce:animate-none"
            />
          ) : (
            <KeyIcon data-icon="inline-start" />
          )}
          {pending ? "Memperbarui…" : "Perbarui kata sandi"}
        </Button>
      </FieldGroup>
    </form>
  );
}
