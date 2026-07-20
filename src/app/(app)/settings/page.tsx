"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Monitor,
  Moon,
  Palette,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/features/auth/auth-context";
import { authApi } from "@/lib/api/services";
import { initials } from "@/lib/format";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(6, "Enter a valid phone number").or(z.literal("")),
  bio: z.string().max(200, "Bio must be 200 characters or less").or(z.literal("")),
});

const passwordSchema = z
  .object({
    current: z.string().min(1, "Current password is required"),
    next: z.string().min(8, "New password must be at least 8 characters"),
    confirm: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.next === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

function ProfileTab() {
  const { user, setUser } = useAuth();

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      bio: user?.bio ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: (v: ProfileValues) => authApi.updateProfile(v),
    onSuccess: (updated) => {
      setUser(updated);
      toast.success("Profile updated", { description: "Your changes have been saved." });
    },
    onError: () => toast.error("Update failed"),
  });

  const isBusy = mutation.isPending;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {user ? initials(user.name) : "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{user?.name}</CardTitle>
            <CardDescription className="capitalize">{user?.role}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="space-y-4"
            noValidate
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input disabled={isBusy} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" disabled={isBusy} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" disabled={isBusy} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="sm:col-span-2">
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Input placeholder="A short bio (optional)" disabled={isBusy} {...field} />
                      </FormControl>
                      <FormDescription>{(field.value ?? "").length}/200 characters</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <Button type="submit" disabled={isBusy}>
              {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isBusy ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function SecurityTab() {
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNext, setShowNext] = React.useState(false);

  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current: "", next: "", confirm: "" },
  });

  const mutation = useMutation({
    mutationFn: (v: PasswordValues) => authApi.changePassword(v.current, v.next),
    onSuccess: () => {
      form.reset();
      toast.success("Password changed", { description: "You can now use your new password." });
    },
    onError: () => toast.error("Failed to change password"),
  });

  const isBusy = mutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Change Password</CardTitle>
        <CardDescription>Choose a strong password you haven&apos;t used before.</CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="max-w-md space-y-4"
            noValidate
          >
            {(["current", "next", "confirm"] as const).map((name, i) => {
              const show = i === 0 ? showCurrent : showNext;
              const setShow = i === 0 ? setShowCurrent : setShowNext;
              const label = i === 0 ? "Current password" : i === 1 ? "New password" : "Confirm new password";
              return (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{label}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={i === 2 ? (showNext ? "text" : "password") : show ? "text" : "password"}
                            autoComplete={i === 0 ? "current-password" : "new-password"}
                            disabled={isBusy}
                            className="pr-9"
                            {...field}
                          />
                          {i < 2 && (
                            <button
                              type="button"
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              onClick={() => setShow((v) => !v)}
                              tabIndex={-1}
                            >
                              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              );
            })}
            <Button type="submit" disabled={isBusy}>
              {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isBusy ? "Changing…" : "Change password"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function AppearanceTab() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Appearance</CardTitle>
        <CardDescription>Customize how LibraryOS looks for you.</CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6 space-y-6">
        <div>
          <p className="mb-3 text-sm font-medium">Theme</p>
          <div className="flex gap-3">
            {themes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 px-5 py-4 transition-all ${
                  theme === value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <Icon className={`h-5 w-5 ${theme === value ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-xs font-medium ${theme === value ? "text-primary" : "text-muted-foreground"}`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Settings"
        description="Manage your account, security, and preferences."
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Tabs defaultValue="profile">
          <TabsList className="mb-4">
            <TabsTrigger value="profile">
              <User className="mr-1.5 h-3.5 w-3.5" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security">
              <KeyRound className="mr-1.5 h-3.5 w-3.5" />
              Security
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Palette className="mr-1.5 h-3.5 w-3.5" />
              Appearance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile"><ProfileTab /></TabsContent>
          <TabsContent value="security"><SecurityTab /></TabsContent>
          <TabsContent value="appearance"><AppearanceTab /></TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
