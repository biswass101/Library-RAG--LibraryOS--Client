"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookCopy,
  Calendar,
  DollarSign,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Settings,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/features/auth/auth-context";
import { formatDate, initials } from "@/lib/format";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-primary/10 text-primary",
  librarian: "bg-chart-2/15 text-chart-2",
  member: "bg-muted text-muted-foreground",
};

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="My Profile"
        description="Your account information and activity summary."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/settings">
                <Settings data-icon="inline-start" />
                Settings
              </Link>
            </Button>
            <Button asChild>
              <Link href="/settings">
                <Pencil data-icon="inline-start" />
                Edit profile
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="h-full">
            <CardContent className="flex flex-col items-center gap-6 pt-10">
              <div className="relative">
                <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                    {initials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-chart-3 text-white ring-2 ring-background">
                  <User className="h-3 w-3" />
                </span>
              </div>

              <div className="text-center">
                <h2 className="text-xl font-bold">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <Badge className={`mt-2 capitalize ${ROLE_COLORS[user.role]}`} variant="secondary">
                  {user.role}
                </Badge>
              </div>

              {user.bio && (
                <>
                  <Separator />
                  <p className="text-center text-sm text-muted-foreground leading-relaxed">
                    {user.bio}
                  </p>
                </>
              )}

              <Separator className="w-full" />

              <div className="w-full space-y-3">
                <div className="flex items-center gap-2.5 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>Member since {formatDate(user.createdAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="lg:col-span-2 space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {[
                  { icon: User, label: "Full Name", value: user.name },
                  { icon: Mail, label: "Email Address", value: user.email },
                  { icon: Phone, label: "Phone", value: user.phone ?? "Not set" },
                  { icon: User, label: "Role", value: user.role, capitalize: true },
                  { icon: Calendar, label: "Account Created", value: formatDate(user.createdAt) },
                ].map(({ icon: Icon, label, value, capitalize }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className={`text-sm font-medium ${capitalize ? "capitalize" : ""}`}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Navigation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { href: "/dashboard", icon: BookCopy, label: "Dashboard", description: "Overview and analytics" },
                  { href: "/books", icon: BookCopy, label: "Books", description: "Manage the catalog" },
                  { href: "/members", icon: User, label: "Members", description: "Manage library members" },
                  { href: "/borrows", icon: DollarSign, label: "Borrows", description: "Issue and return books" },
                  { href: "/documents", icon: Mail, label: "Documents", description: "Upload knowledge base files" },
                  { href: "/settings", icon: Settings, label: "Settings", description: "Manage your account" },
                ].map(({ href, icon: Icon, label, description }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/50 hover:border-primary/30"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
