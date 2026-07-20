"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";
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

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});

type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = React.useState(false);
  const [sentEmail, setSentEmail] = React.useState("");

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: Values) {
    try {
      await authApi.forgotPassword(values.email);
      setSentEmail(values.email);
      setSent(true);
      toast.success("Reset link sent!", { description: `Check your inbox at ${values.email}.` });
    } catch {
      toast.error("Something went wrong", { description: "Please try again later." });
    }
  }

  return (
    <AnimatePresence mode="wait">
      {sent ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="space-y-6 text-center"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              We sent a password reset link to{" "}
              <span className="font-medium text-foreground">{sentEmail}</span>.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Didn&apos;t receive it? Check your spam folder, or{" "}
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => setSent(false)}
            >
              try again
            </button>
            .
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Link>
          </Button>
        </motion.div>
      ) : (
        <motion.div
          key="form"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <div className="space-y-1.5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Forgot your password?</h1>
            <p className="text-sm text-muted-foreground">
              No worries. Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@library.io"
                        autoComplete="email"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isSubmitting ? "Sending…" : "Send reset link"}
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
