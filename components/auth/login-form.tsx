"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconArrowRight, IconEye, IconEyeOff, IconLoader2 } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
    <form className="login-form" onSubmit={handleSubmit}>
      <Field>
        <FieldLabel htmlFor="email">Email dinas</FieldLabel>
        <Input
          className="h-11 bg-card"
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
        <div className="password-field">
          <Input
            className="h-11 bg-card pr-12"
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Masukkan kata sandi"
            required
          />
          <Button
            className="absolute inset-y-1 right-1 h-9 w-9 text-muted-foreground"
            size="icon"
            variant="ghost"
            type="button"
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
          </Button>
        </div>
      </Field>
      {error ? <FieldError>{error}</FieldError> : null}
      <Button className="login-submit h-11 shadow-[0_8px_20px_rgba(35,122,75,.17)]" disabled={pending} type="submit">
        {pending ? <IconLoader2 className="spin" size={18} /> : <IconArrowRight size={18} />}
        {pending ? "Memeriksa…" : "Masuk ke ruang kerja"}
      </Button>
    </form>
  );
}
