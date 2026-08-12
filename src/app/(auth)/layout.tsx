import { BookMarked, MessageSquareText, ScanSearch, Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh w-full lg:grid-cols-2">
      {/* Brand panel */}
  <div className="relative hidden flex-col justify-between overflow-hidden bg-black p-10 text-white lg:flex">

  {/* Background image */}
  <img
    src="/library-os-cover-image.png"
    alt=""
    aria-hidden
    className="absolute inset-0 h-full w-full object-cover"
  />

  {/* Solid black overlay — NO GRADIENT */}
  <div className="absolute inset-0 bg-black/70" />

  {/* Brand */}
  <div className="relative z-10 flex items-center gap-2.5">
    <div className="flex size-9 items-center justify-center overflow-hidden rounded-xl bg-white/10">
      <img
        src="/Library.jpg"
        alt="LibraryOS"
        className="size-full object-cover"
      />
    </div>

    <span className="text-lg font-semibold tracking-tight text-white">
      LibraryOS
    </span>
  </div>

  {/* Main content */}
  <div className="relative z-10 max-w-md space-y-6">
    <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white">
      Run your entire library from one beautiful workspace.
    </h1>

    <ul className="space-y-4 text-sm/6 text-white/85">
      <li className="flex gap-3">
        <ScanSearch className="mt-0.5 size-5 shrink-0 text-primary" />
        Catalog, circulation, members and fines — unified and searchable.
      </li>

      <li className="flex gap-3">
        <MessageSquareText className="mt-0.5 size-5 shrink-0 text-primary" />
        Ask the AI assistant anything about your policies and documents.
      </li>

      <li className="flex gap-3">
        <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
        Real-time dashboards, reports and overdue tracking out of the box.
      </li>
    </ul>
  </div>

  {/* Footer */}
  <p className="relative z-10 text-xs text-white/50">
    © 2026 LibraryOS · Central Branch
  </p>
</div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
