import {
  BarChart3,
  BookCopy,
  BookMarked,
  Building2,
  CalendarClock,
  FileText,
  LayoutDashboard,
  Library,
  MessageSquareText,
  PenLine,
  Settings,
  Shapes,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "AI Assistant", href: "/chat", icon: MessageSquareText, badge: "RAG" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { title: "Books", href: "/books", icon: Library },
      { title: "Categories", href: "/categories", icon: Shapes },
      { title: "Authors", href: "/authors", icon: PenLine },
      { title: "Publishers", href: "/publishers", icon: Building2 },
    ],
  },
  {
    label: "Circulation",
    items: [
      { title: "Members", href: "/members", icon: Users },
      { title: "Borrows", href: "/borrows", icon: BookCopy },
      { title: "Reservations", href: "/reservations", icon: CalendarClock },
    ],
  },
  {
    label: "Knowledge",
    items: [
      { title: "Documents", href: "/documents", icon: FileText },
      { title: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [{ title: "Settings", href: "/settings", icon: Settings }],
  },
];

export const BRAND = {
  name: "LibraryOS",
  icon: BookMarked,
} as const;

/** Maps a pathname segment to a human label for breadcrumbs. */
export const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  chat: "AI Assistant",
  books: "Books",
  new: "New",
  edit: "Edit",
  categories: "Categories",
  authors: "Authors",
  publishers: "Publishers",
  members: "Members",
  borrows: "Borrows",
  reservations: "Reservations",
  documents: "Documents",
  reports: "Reports",
  settings: "Settings",
  profile: "Profile",
};
