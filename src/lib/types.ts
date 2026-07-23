/** Core domain types shared across the app. */

export type Role = "admin" | "librarian" | "member";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  bookCount: number;
  createdAt: string;
}

export interface Author {
  id: string;
  name: string;
  country: string;
  bio: string;
  bookCount: number;
  createdAt: string;
}

export interface Publisher {
  id: string;
  name: string;
  website: string;
  address: string;
  bookCount: number;
  createdAt: string;
}

export type BookStatus = "available" | "low-stock" | "out-of-stock";

export interface ShelfSlot {
  id: string;
  code: string;
  label: string;
  capacity: number;
  description?: string | null;
  active: boolean;
  books?: Array<{ id: string; title: string; availableCopies: number }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Book {
  id: string;
  title: string;
  isbn: string;
  categoryId: string;
  categoryName: string;
  authorId: string;
  authorName: string;
  publisherId: string;
  publisherName: string;
  publishedYear: number;
  totalCopies: number;
  availableCopies: number;
  shelfLocation: string;
  shelfSlotId?: string | null;
  shelfSlot?: ShelfSlot | null;
  language: string;
  pages: number;
  description: string;
  coverColor: string;
  rating: number;
  borrowCount: number;
  status: BookStatus;
  createdAt: string;
}

export type MemberStatus = "active" | "suspended" | "expired";
export type MembershipPlan = "standard" | "premium" | "student";

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: MemberStatus;
  plan: MembershipPlan;
  joinedAt: string;
  expiresAt: string;
  activeBorrows: number;
  totalBorrows: number;
  outstandingFines: number;
}

export type BorrowStatus = "borrowed" | "returned" | "overdue" | "renewed";

export interface Borrow {
  id: string;
  bookId: string;
  bookTitle: string;
  memberId: string;
  memberName: string;
  issuedAt: string;
  dueAt: string;
  returnedAt: string | null;
  renewCount: number;
  fine: number;
  status: BorrowStatus;
}

export interface Fine {
  id: string;
  borrowId: string;
  memberId: string;
  memberName: string;
  bookTitle: string;
  amount: number;
  reason: string;
  status: "paid" | "unpaid" | "waived";
  createdAt: string;
}

export type ReservationStatus = "pending" | "ready" | "fulfilled" | "cancelled" | "expired";

export interface Reservation {
  id: string;
  bookId: string;
  bookTitle: string;
  memberId: string;
  memberName: string;
  reservedAt: string;
  expiresAt: string;
  status: ReservationStatus;
  queuePosition: number;
}

export type DocumentType = "pdf" | "docx" | "txt" | "image";
export type DocumentStatus = "processing" | "indexed" | "failed";

export interface LibraryDocument {
  id: string;
  name: string;
  type: DocumentType;
  sizeBytes: number;
  pages: number | null;
  status: DocumentStatus;
  uploadedBy: string;
  uploadedAt: string;
  chunkCount: number;
}

export type NotificationType = "due" | "overdue" | "reservation" | "system" | "fine" | "member" | "document";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export type ActivityType =
  | "borrow"
  | "return"
  | "member"
  | "book"
  | "fine"
  | "reservation"
  | "document";

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  actor: string;
  createdAt: string;
}

export interface DashboardStats {
  totalBooks: number;
  borrowedBooks: number;
  returnedBooks: number;
  availableBooks: number;
  members: number;
  librarians: number;
  documents: number;
  activeReservations: number;
  totalBooksDelta: number;
  borrowedDelta: number;
  returnedDelta: number;
  membersDelta: number;
}

export interface BorrowTrendPoint {
  month: string;
  borrowed: number;
  returned: number;
}

export interface CategoryShare {
  name: string;
  value: number;
}

export interface MonthlyStatPoint {
  month: string;
  newMembers: number;
  finesCollected: number;
  newBooks: number;
}

export interface ChatSource {
  documentId: string;
  documentName: string;
  page: number;
  snippet: string;
  score: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}
