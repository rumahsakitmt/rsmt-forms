"use client";
import { cn } from "@/lib/utils";

import { useActionState } from "react";
import { SpinnerGapIcon, UserPlusIcon } from "@phosphor-icons/react";

import { createStaffAction, type CreateStaffState } from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import {
  FieldGroup,
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

const initialState: CreateStaffState = { success: false, message: "" };

export function CreateStaffForm() {
  const [state, action, pending] = useActionState(
    createStaffAction,
    initialState,
  );

  return (
    <form action={action}>
      <FieldGroup>
        <Field data-invalid={Boolean(state.errors?.name)}>
          <FieldLabel htmlFor="name">Nama lengkap</FieldLabel>
          <Input
            aria-invalid={Boolean(state.errors?.name)}
            id="name"
            name="name"
            required
          />
          <FieldError>{state.errors?.name}</FieldError>
        </Field>
        <Field data-invalid={Boolean(state.errors?.email)}>
          <FieldLabel htmlFor="email">Email dinas</FieldLabel>
          <Input
            aria-invalid={Boolean(state.errors?.email)}
            id="email"
            name="email"
            type="email"
            required
          />
          <FieldError>{state.errors?.email}</FieldError>
        </Field>
        <Field data-invalid={Boolean(state.errors?.password)}>
          <FieldLabel htmlFor="password">Kata sandi sementara</FieldLabel>
          <Input
            aria-invalid={Boolean(state.errors?.password)}
            id="password"
            name="password"
            type="password"
            minLength={10}
            required
          />
          <FieldError>{state.errors?.password}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="role">Peran</FieldLabel>
          <NativeSelect
            className="w-full"
            defaultValue="STAFF"
            id="role"
            name="role"
          >
            <NativeSelectOption value="STAFF">Staf klinis</NativeSelectOption>
            <NativeSelectOption value="ADMIN">Administrator</NativeSelectOption>
          </NativeSelect>
        </Field>
        {state.message ? (
          <p
            className={cn(
              state.success
                ? "text-sm text-muted-foreground"
                : "text-sm text-destructive",
            )}
            aria-live="polite"
          >
            {state.message}
          </p>
        ) : null}
        <Button className="h-10 w-fit px-4" disabled={pending} type="submit">
          {pending ? (
            <SpinnerGapIcon
              data-icon="inline-start"
              className="animate-spin motion-reduce:animate-none"
            />
          ) : (
            <UserPlusIcon data-icon="inline-start" />
          )}
          {pending ? "Membuat…" : "Buat akun"}
        </Button>
      </FieldGroup>
    </form>
  );
}
