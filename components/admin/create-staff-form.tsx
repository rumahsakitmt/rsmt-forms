"use client";

import { useActionState } from "react";
import { IconLoader2, IconUserPlus } from "@tabler/icons-react";

import { createStaffAction, type CreateStaffState } from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

const initialState: CreateStaffState = { success: false, message: "" };

export function CreateStaffForm() {
  const [state, action, pending] = useActionState(createStaffAction, initialState);

  return (
    <form action={action} className="admin-form">
      <Field data-invalid={Boolean(state.errors?.name)}><FieldLabel htmlFor="name">Nama lengkap</FieldLabel><Input aria-invalid={Boolean(state.errors?.name)} className="h-11 bg-card" id="name" name="name" required /><FieldError>{state.errors?.name}</FieldError></Field>
      <Field data-invalid={Boolean(state.errors?.email)}><FieldLabel htmlFor="email">Email dinas</FieldLabel><Input aria-invalid={Boolean(state.errors?.email)} className="h-11 bg-card" id="email" name="email" type="email" required /><FieldError>{state.errors?.email}</FieldError></Field>
      <Field data-invalid={Boolean(state.errors?.password)}><FieldLabel htmlFor="password">Kata sandi sementara</FieldLabel><Input aria-invalid={Boolean(state.errors?.password)} className="h-11 bg-card" id="password" name="password" type="password" minLength={10} required /><FieldError>{state.errors?.password}</FieldError></Field>
      <Field><FieldLabel htmlFor="role">Peran</FieldLabel><NativeSelect className="w-full" defaultValue="STAFF" id="role" name="role"><NativeSelectOption value="STAFF">Staf klinis</NativeSelectOption><NativeSelectOption value="ADMIN">Administrator</NativeSelectOption></NativeSelect></Field>
      {state.message ? (
        <p className={state.success ? "save-message" : "form-error"} aria-live="polite">{state.message}</p>
      ) : null}
      <Button className="h-10 w-fit px-4" disabled={pending} type="submit">
        {pending ? <IconLoader2 className="spin" size={18} /> : <IconUserPlus size={18} />}
        {pending ? "Membuat…" : "Buat akun"}
      </Button>
    </form>
  );
}
