import { BookMarked, MessageSquareText, ScanSearch, Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh w-full lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex dark:bg-card">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, oklch(1 0 0 / 18%) 0, transparent 45%), radial-gradient(circle at 80% 90%, oklch(1 0 0 / 12%) 0, transparent 40%)",
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <BookMarked className="size-5" aria-hidden />
          </div>
          <span className="text-lg font-semibold tracking-tight">LibraryOS</span>
        </div>

        <div className="relative max-w-md space-y-6">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            Run your entire library from one beautiful workspace.
          </h1>
          <ul className="space-y-4 text-sm/6 opacity-90">
            <li className="flex gap-3">
              <ScanSearch className="mt-0.5 size-5 shrink-0" aria-hidden />
              Catalog, circulation, members and fines — unified and searchable.
            </li>
            <li className="flex gap-3">
              <MessageSquareText className="mt-0.5 size-5 shrink-0" aria-hidden />
              Ask the AI assistant anything about your policies and documents.
            </li>
            <li className="flex gap-3">
              <Sparkles className="mt-0.5 size-5 shrink-0" aria-hidden />
              Real-time dashboards, reports and overdue tracking out of the box.
            </li>
          </ul>
        </div>

        <p className="relative text-xs opacity-70">© 2026 LibraryOS · Central Branch</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
