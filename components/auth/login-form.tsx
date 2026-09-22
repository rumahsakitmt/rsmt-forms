"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import {
  FieldGroup,
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.ChangeEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const result = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
      rememberMe: true,
    });

    if (result.error) {
      setError("Email atau kata sandi tidak sesuai.");
      setPending(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form className="mt-6" onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email RSMT</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nama@rsud.go.id"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Kata sandi</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Masukkan kata sandi"
              required
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-sm"
                variant="ghost"
                type="button"
                aria-label={
                  showPassword
                    ? "Sembunyikan kata sandi"
                    : "Tampilkan kata sandi"
                }
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? (
                  <EyeSlashIcon data-icon="inline-start" />
                ) : (
                  <EyeIcon data-icon="inline-start" />
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
        {error ? <FieldError>{error}</FieldError> : null}
        <Button className="w-full" disabled={pending} type="submit">
          {pending ? (
            <SpinnerGapIcon
              data-icon="inline-start"
              className="animate-spin motion-reduce:animate-none"
            />
          ) : (
            <ArrowRightIcon data-icon="inline-start" />
          )}
          {pending ? "Memeriksa…" : "Masuk ke ruang kerja"}
        </Button>
      </FieldGroup>
    </form>
  );
}
