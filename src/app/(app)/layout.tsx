"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";
import { useAuth } from "@/features/auth/auth-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-sidebar lg:block">
        <SidebarNav />
      </aside>
      <div className="flex min-h-svh w-full flex-1 flex-col lg:pl-64">
        <Topbar />
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex-1"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
