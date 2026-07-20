"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api/services";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type Values = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "demo-token";
  const [done, setDone] = React.useState(false);
  const [showPw, setShowPw] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: Values) {
    try {
      await authApi.resetPassword(token, values.password);
      setDone(true);
      toast.success("Password reset!", { description: "You can now sign in with your new password." });
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      toast.error("Reset failed", { description: "The link may have expired. Request a new one." });
    }
  }

  const requirements = [
    { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
    { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
    { label: "One number", test: (v: string) => /[0-9]/.test(v) },
  ];

  const pwValue = form.watch("password");

  return (
    <AnimatePresence mode="wait">
      {done ? (
        <motion.div
          key="done"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6 text-center"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">Password reset!</h1>
            <p className="text-sm text-muted-foreground">
              Your password has been updated. Redirecting you to sign in…
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/login">Sign in now</Link>
          </Button>
        </motion.div>
      ) : (
        <motion.div
          key="form"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="space-y-1.5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
            <p className="text-sm text-muted-foreground">
              Create a strong password for your account.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPw ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          disabled={isSubmitting}
                          className="pr-9"
                          {...field}
                        />
                        <button
                          type="button"
                          aria-label={showPw ? "Hide password" : "Show password"}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                          onClick={() => setShowPw((v) => !v)}
                          tabIndex={-1}
                        >
                          {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                    {/* Password strength indicators */}
                    <div className="mt-2 space-y-1">
                      {requirements.map((req) => (
                        <div key={req.label} className="flex items-center gap-2">
                          <div
                            className={`h-1.5 w-1.5 rounded-full transition-colors ${
                              req.test(pwValue) ? "bg-primary" : "bg-muted-foreground/30"
                            }`}
                          />
                          <span
                            className={`text-xs transition-colors ${
                              req.test(pwValue) ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirm ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          disabled={isSubmitting}
                          className="pr-9"
                          {...field}
                        />
                        <button
                          type="button"
                          aria-label={showConfirm ? "Hide password" : "Show password"}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                          onClick={() => setShowConfirm((v) => !v)}
                          tabIndex={-1}
                        >
                          {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? "Resetting…" : "Reset password"}
              </Button>
            </form>
          </Form>

          <Button asChild variant="ghost" className="w-full">
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Link>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
