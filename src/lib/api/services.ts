import { apiClient } from "./client";
import type {
  Activity,
  AppNotification,
  Author,
  Book,
  Borrow,
  BorrowTrendPoint,
  Category,
  CategoryShare,
  ChatMessage,
  Conversation,
  DashboardStats,
  Fine,
  LibraryDocument,
  Member,
  MonthlyStatPoint,
  Paginated,
  Publisher,
  Reservation,
  User,
} from "@/lib/types";

export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  filters?: Record<string, string | undefined>;
}

const buildQuery = (params: ListParams) => {
  const query = new URLSearchParams();
  if (params.page) query.append("page", String(params.page));
  if (params.pageSize) query.append("pageSize", String(params.pageSize));
  if (params.search) query.append("search", params.search);
  if (params.sortBy) query.append("sortBy", params.sortBy);
  if (params.sortDir) query.append("sortDir", params.sortDir);
  if (params.filters) {
    for (const [key, val] of Object.entries(params.filters)) {
      if (val && val !== "all") query.append(key, val);
    }
  }
  return query.toString();
};

/* ------------------------------ Mappers ---------------------------------- */
/**
 * The backend returns Prisma rows with nested relations; the UI expects the
 * flattened shapes in `@/lib/types`. These mappers are the adapter layer so
 * pages, tables and hooks stay untouched.
 */

const FALLBACK_COVER = "#6366f1";

const bookStatus = (available: number, total: number): Book["status"] => {
  if (available <= 0) return "out-of-stock";
  if (available <= 2 || available < total * 0.2) return "low-stock";
  return "available";
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapBook = (raw: any): Book => ({
  ...raw,
  categoryName: raw.categoryName ?? raw.category?.name ?? "—",
  authorName: raw.authorName ?? raw.author?.name ?? "—",
  publisherName: raw.publisherName ?? raw.publisher?.name ?? "—",
  coverColor: raw.coverColor ?? FALLBACK_COVER,
  rating: raw.rating ?? 0,
  status: bookStatus(raw.availableCopies, raw.totalCopies),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapBorrow = (raw: any): Borrow => ({
  ...raw,
  bookTitle: raw.bookTitle ?? raw.book?.title ?? "—",
  memberName: raw.memberName ?? raw.member?.name ?? "—",
  fine: raw.fine ?? raw.fineAmount ?? 0,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapReservation = (raw: any): Reservation => ({
  ...raw,
  bookTitle: raw.bookTitle ?? raw.book?.title ?? "—",
  memberName: raw.memberName ?? raw.member?.name ?? "—",
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapFine = (raw: any): Fine => ({
  ...raw,
  memberName: raw.memberName ?? raw.member?.name ?? "—",
  bookTitle: raw.bookTitle ?? raw.borrow?.book?.title ?? "—",
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDocument = (raw: any): LibraryDocument => ({
  ...raw,
  uploadedAt: raw.uploadedAt ?? raw.createdAt,
  uploadedBy: raw.user?.name ?? raw.uploadedBy ?? "—",
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapPage = <T>(data: any, map: (raw: any) => T): Paginated<T> => ({
  ...data,
  items: (data.items ?? []).map(map),
});

/* ------------------------------- Auth ---------------------------------- */

export const authApi = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await apiClient.post("/auth/login", { email, password });
    return {
      user: res.data.user,
      token: res.data.accessToken,
    };
  },
  async forgotPassword(email: string): Promise<{ message: string }> {
    return { message: `A reset link has been sent to ${email}.` }; // Placeholder
  },
  async resetPassword(_token: string, _password: string): Promise<{ message: string }> {
    return { message: "Your password has been reset successfully." }; // Placeholder
  },
  async me(): Promise<User> {
    // The backend login returns the user. We might not have a /me, so we rely on local storage or implement a dummy one
    const res = await apiClient.get("/users");
    // Just grab the first user for now, or decode JWT in a real scenario
    return res.data[0]; 
  },
  async updateProfile(patch: Partial<Pick<User, "name" | "email" | "phone" | "bio">>): Promise<User> {
    return patch as User; // Placeholder
  },
  async changePassword(_current: string, _next: string): Promise<{ message: string }> {
    return { message: "Password updated." }; // Placeholder
  },
};

/* ----------------------------- Dashboard -------------------------------- */

export const dashboardApi = {
  async stats(): Promise<DashboardStats> {
    const res = await apiClient.get("/reports/dashboard/stats");
    return {
      ...res.data,
      totalBooksDelta: 0,
      borrowedDelta: 0,
      returnedDelta: 0,
      membersDelta: 0,
    };
  },
  async borrowTrend(): Promise<BorrowTrendPoint[]> {
    const res = await apiClient.get("/reports/dashboard/borrow-trend");
    return res.data;
  },
  async popularCategories(): Promise<CategoryShare[]> {
    const res = await apiClient.get("/reports/dashboard/popular-categories");
    return res.data;
  },
  async monthlyStats(): Promise<MonthlyStatPoint[]> {
    const res = await apiClient.get("/reports/dashboard/monthly-stats");
    return res.data;
  },
  async recentActivity(): Promise<Activity[]> {
    const res = await apiClient.get("/reports/dashboard/recent-activity");
    return res.data;
  },
  async upcomingDue(): Promise<Borrow[]> {
    const res = await apiClient.get("/reports/dashboard/upcoming-due");
    return res.data.map(mapBorrow);
  },
  async mostBorrowed(): Promise<Book[]> {
    const res = await apiClient.get("/reports/books/top-borrowed?limit=5");
    return res.data.map(mapBook);
  },
  async newestMembers(): Promise<Member[]> {
    const res = await apiClient.get("/reports/members/active?limit=5");
    return res.data;
  },
};

/* -------------------------------- Books --------------------------------- */

export type BookInput = Omit<
  Book,
  | "id" | "categoryName" | "authorName" | "publisherName" | "status"
  | "rating" | "borrowCount" | "createdAt" | "coverColor"
>;

export const booksApi = {
  async list(params: ListParams): Promise<Paginated<Book>> {
    const res = await apiClient.get(`/books?${buildQuery(params)}`);
    return mapPage(res.data, mapBook);
  },
  async get(id: string): Promise<Book> {
    const res = await apiClient.get(`/books/${id}`);
    return mapBook(res.data);
  },
  async create(input: BookInput): Promise<Book> {
    const res = await apiClient.post("/books", input);
    return mapBook(res.data);
  },
  async update(id: string, input: Partial<BookInput>): Promise<Book> {
    const res = await apiClient.put(`/books/${id}`, input);
    return mapBook(res.data);
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/books/${id}`);
  },
  async borrowHistory(bookId: string): Promise<Borrow[]> {
    const res = await apiClient.get(`/books/${bookId}/borrow-history`);
    return res.data.map(mapBorrow);
  },
};

/* ------------------------ Simple taxonomy CRUD --------------------------- */

function crud<T>(endpoint: string) {
  return {
    async list(params: ListParams): Promise<Paginated<T>> {
      const res = await apiClient.get(`${endpoint}?${buildQuery(params)}`);
      return res.data;
    },
    async all(): Promise<T[]> {
      const res = await apiClient.get(`${endpoint}?pageSize=1000`);
      return res.data.items || [];
    },
    async create(input: any): Promise<T> {
      const res = await apiClient.post(endpoint, input);
      return res.data;
    },
    async update(id: string, input: any): Promise<T> {
      const res = await apiClient.put(`${endpoint}/${id}`, input);
      return res.data;
    },
    async remove(id: string): Promise<void> {
      await apiClient.delete(`${endpoint}/${id}`);
    },
  };
}

export const categoriesApi = crud<Category>("/categories");
export const authorsApi = crud<Author>("/authors");
export const publishersApi = crud<Publisher>("/publishers");

/* ------------------------------- Members --------------------------------- */

export type MemberInput = Omit<Member, "id" | "joinedAt" | "activeBorrows" | "totalBorrows" | "outstandingFines">;

export const membersApi = {
  async list(params: ListParams): Promise<Paginated<Member>> {
    const res = await apiClient.get(`/members?${buildQuery(params)}`);
    return res.data;
  },
  async all(): Promise<Member[]> {
    const res = await apiClient.get("/members?pageSize=1000");
    return res.data.items || [];
  },
  async get(id: string): Promise<Member> {
    const res = await apiClient.get(`/members/${id}`);
    return res.data;
  },
  async create(input: MemberInput): Promise<Member> {
    const res = await apiClient.post("/members", input);
    return res.data;
  },
  async update(id: string, input: Partial<MemberInput>): Promise<Member> {
    const res = await apiClient.put(`/members/${id}`, input);
    return res.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/members/${id}`);
  },
  async borrowHistory(memberId: string): Promise<Borrow[]> {
    const res = await apiClient.get(`/members/${memberId}/borrow-history`);
    return res.data.map(mapBorrow);
  },
  async fineHistory(memberId: string): Promise<Fine[]> {
    const res = await apiClient.get(`/members/${memberId}/fine-history`);
    return res.data.map(mapFine);
  },
};

/* ------------------------------- Borrows --------------------------------- */

export const borrowsApi = {
  async list(params: ListParams): Promise<Paginated<Borrow>> {
    const res = await apiClient.get(`/borrows?${buildQuery(params)}`);
    return mapPage(res.data, mapBorrow);
  },
  async issue(input: { bookId: string; memberId: string; dueAt: string }): Promise<Borrow> {
    const res = await apiClient.post("/borrows", input);
    return mapBorrow(res.data);
  },
  async returnBook(id: string): Promise<Borrow> {
    const res = await apiClient.post(`/borrows/${id}/return`);
    return mapBorrow(res.data);
  },
  async renew(id: string): Promise<Borrow> {
    const res = await apiClient.post(`/borrows/${id}/renew`);
    return mapBorrow(res.data);
  },
};

export const finesApi = {
  async list(params: ListParams): Promise<Paginated<Fine>> {
    const res = await apiClient.get(`/fines?${buildQuery(params)}`);
    return mapPage(res.data, mapFine);
  },
  async settle(id: string, mode: "paid" | "waived"): Promise<Fine> {
    const res = await apiClient.patch(`/fines/${id}/settle`, { status: mode });
    return mapFine(res.data);
  },
};

/* ----------------------------- Reservations ------------------------------ */

export const reservationsApi = {
  async list(params: ListParams): Promise<Paginated<Reservation>> {
    const res = await apiClient.get(`/reservations?${buildQuery(params)}`);
    return mapPage(res.data, mapReservation);
  },
  async create(input: { bookId: string; memberId: string }): Promise<Reservation> {
    const res = await apiClient.post("/reservations", input);
    return mapReservation(res.data);
  },
  async updateStatus(id: string, status: Reservation["status"]): Promise<Reservation> {
    const res = await apiClient.patch(`/reservations/${id}/status`, { status });
    return mapReservation(res.data);
  },
};

/* ------------------------------ Documents -------------------------------- */

export const documentsApi = {
  async list(params: ListParams): Promise<Paginated<LibraryDocument>> {
    const res = await apiClient.get(`/documents?${buildQuery(params)}`);
    return mapPage(res.data, mapDocument);
  },
  async upload(file: File): Promise<LibraryDocument> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post("/documents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return mapDocument(res.data);
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/documents/${id}`);
  },
};

/* ---------------------------- Notifications ------------------------------ */

export const notificationsApi = {
  async list(): Promise<AppNotification[]> {
    return []; // Placeholder, backend does not have notifications yet
  },
  async markRead(_id: string): Promise<void> {},
  async markAllRead(): Promise<void> {},
};

/* -------------------------------- Chat ----------------------------------- */

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Conversations are persisted client-side in localStorage so history survives
 * page reloads. The backend `/rag/chat` endpoint is stateless (it only answers
 * a single question), so the transcript lives entirely on the client.
 */
const CHAT_STORAGE_KEY = "library-rag:conversations";

const loadConversations = (): Conversation[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Conversation[]) : [];
  } catch {
    return [];
  }
};

const saveConversations = (convs: Conversation[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(convs));
  } catch {
    /* storage full or unavailable — keep the in-memory copy */
  }
};

// In-memory cache, hydrated from localStorage on first access.
let localConversations: Conversation[] | null = null;

const store = (): Conversation[] => {
  if (localConversations === null) localConversations = loadConversations();
  return localConversations;
};

const persist = () => saveConversations(store());

export const chatApi = {
  async conversations(): Promise<Conversation[]> {
    return [...store()].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  },
  async createConversation(firstMessage: string): Promise<Conversation> {
    const conv: Conversation = {
      id: uid(),
      title: firstMessage.length > 42 ? `${firstMessage.slice(0, 42)}…` : firstMessage,
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    store().unshift(conv);
    persist();
    return conv;
  },
  async deleteConversation(id: string): Promise<void> {
    const convs = store();
    const idx = convs.findIndex((c) => c.id === id);
    if (idx >= 0) {
      convs.splice(idx, 1);
      persist();
    }
  },
  /**
   * Ask a question within a conversation. Both the user message and the AI
   * answer are appended to the persisted conversation and returned together,
   * so the caller never has to construct or dedupe messages itself.
   */
  async ask(
    conversationId: string,
    question: string,
  ): Promise<{ conversation: Conversation; userMsg: ChatMessage; assistantMsg: ChatMessage }> {
    const conv = store().find((c) => c.id === conversationId);
    if (!conv) throw new Error("Conversation not found");

    // Call real RAG backend
    const res = await apiClient.post("/rag/chat", { question, conversationId });
    const { answer, sources } = res.data;

    const now = new Date().toISOString();
    const userMsg: ChatMessage = { id: uid(), role: "user", content: question, createdAt: now };
    const assistantMsg: ChatMessage = {
      id: uid(),
      role: "assistant",
      content: answer,
      sources,
      createdAt: new Date().toISOString(),
    };

    conv.messages.push(userMsg, assistantMsg);
    conv.updatedAt = assistantMsg.createdAt;
    persist();

    return { conversation: { ...conv, messages: [...conv.messages] }, userMsg, assistantMsg };
  },
};

/* ------------------------------- Reports --------------------------------- */

export const reportsApi = {
  async borrowReport(): Promise<{
    trend: BorrowTrendPoint[];
    byStatus: { name: string; value: number }[];
    rows: Borrow[];
  }> {
    const res = await apiClient.get("/reports/borrows");
    return { ...res.data, rows: (res.data.rows ?? []).map(mapBorrow) };
  },
  async memberReport(): Promise<{
    byPlan: { name: string; value: number }[];
    byStatus: { name: string; value: number }[];
    growth: MonthlyStatPoint[];
    top: Member[];
  }> {
    const res = await apiClient.get("/reports/members");
    return res.data;
  },
  async bookReport(): Promise<{
    byCategory: { name: string; value: number }[];
    top: Book[];
    lowStock: Book[];
  }> {
    const res = await apiClient.get("/reports/books");
    return {
      ...res.data,
      top: (res.data.top ?? []).map(mapBook),
      lowStock: (res.data.lowStock ?? []).map(mapBook),
    };
  },
  async fineReport(): Promise<{
    byStatus: { name: string; value: number }[];
    monthly: { month: string; finesCollected: number }[];
    rows: Fine[];
    total: number;
    collected: number;
    outstanding: number;
  }> {
    const res = await apiClient.get("/reports/fines");
    return { ...res.data, rows: (res.data.rows ?? []).map(mapFine) };
  },
};

/* ------------------------------- Search ---------------------------------- */

export interface GlobalSearchResults {
  books: Book[];
  members: Member[];
  documents: LibraryDocument[];
}

export const searchApi = {
  async global(query: string): Promise<GlobalSearchResults> {
    // Simple naive global search using existing list endpoints
    const [books, members, docs] = await Promise.all([
      apiClient.get(`/books?search=${query}&pageSize=5`),
      apiClient.get(`/members?search=${query}&pageSize=5`),
      apiClient.get(`/documents?search=${query}&pageSize=5`),
    ]);
    return {
      books: (books.data.items || []).map(mapBook),
      members: members.data.items || [],
      documents: (docs.data.items || []).map(mapDocument),
    };
  },
};

export const suggestedQuestions = [
  "What is the late fee for premium members?",
  "How many items can a new member borrow?",
  "When is the library open on weekends?",
];
