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
    return res.data;
  },
  async mostBorrowed(): Promise<Book[]> {
    const res = await apiClient.get("/reports/books/top-borrowed?limit=5");
    return res.data;
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
    return res.data;
  },
  async get(id: string): Promise<Book> {
    const res = await apiClient.get(`/books/${id}`);
    return res.data;
  },
  async create(input: BookInput): Promise<Book> {
    const res = await apiClient.post("/books", input);
    return res.data;
  },
  async update(id: string, input: Partial<BookInput>): Promise<Book> {
    const res = await apiClient.put(`/books/${id}`, input);
    return res.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/books/${id}`);
  },
  async borrowHistory(bookId: string): Promise<Borrow[]> {
    const res = await apiClient.get(`/books/${bookId}/borrow-history`);
    return res.data;
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
    return res.data;
  },
  async fineHistory(memberId: string): Promise<Fine[]> {
    const res = await apiClient.get(`/members/${memberId}/fine-history`);
    return res.data;
  },
};

/* ------------------------------- Borrows --------------------------------- */

export const borrowsApi = {
  async list(params: ListParams): Promise<Paginated<Borrow>> {
    const res = await apiClient.get(`/borrows?${buildQuery(params)}`);
    return res.data;
  },
  async issue(input: { bookId: string; memberId: string; dueAt: string }): Promise<Borrow> {
    const res = await apiClient.post("/borrows", input);
    return res.data;
  },
  async returnBook(id: string): Promise<Borrow> {
    const res = await apiClient.post(`/borrows/${id}/return`);
    return res.data;
  },
  async renew(id: string): Promise<Borrow> {
    const res = await apiClient.post(`/borrows/${id}/renew`);
    return res.data;
  },
};

export const finesApi = {
  async list(params: ListParams): Promise<Paginated<Fine>> {
    const res = await apiClient.get(`/fines?${buildQuery(params)}`);
    return res.data;
  },
  async settle(id: string, mode: "paid" | "waived"): Promise<Fine> {
    const res = await apiClient.patch(`/fines/${id}/settle`, { status: mode });
    return res.data;
  },
};

/* ----------------------------- Reservations ------------------------------ */

export const reservationsApi = {
  async list(params: ListParams): Promise<Paginated<Reservation>> {
    const res = await apiClient.get(`/reservations?${buildQuery(params)}`);
    return res.data;
  },
  async create(input: { bookId: string; memberId: string }): Promise<Reservation> {
    const res = await apiClient.post("/reservations", input);
    return res.data;
  },
  async updateStatus(id: string, status: Reservation["status"]): Promise<Reservation> {
    const res = await apiClient.patch(`/reservations/${id}/status`, { status });
    return res.data;
  },
};

/* ------------------------------ Documents -------------------------------- */

export const documentsApi = {
  async list(params: ListParams): Promise<Paginated<LibraryDocument>> {
    const res = await apiClient.get(`/documents?${buildQuery(params)}`);
    return res.data;
  },
  async upload(file: File): Promise<LibraryDocument> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post("/documents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
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

const uid = () => `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const localConversations: Conversation[] = []; // Store conversations locally

export const chatApi = {
  async conversations(): Promise<Conversation[]> {
    return [...localConversations].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  },
  async createConversation(firstMessage: string): Promise<Conversation> {
    const conv: Conversation = {
      id: uid(),
      title: firstMessage.length > 42 ? `${firstMessage.slice(0, 42)}…` : firstMessage,
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    localConversations.unshift(conv);
    return conv;
  },
  async deleteConversation(id: string): Promise<void> {
    const idx = localConversations.findIndex((c) => c.id === id);
    if (idx >= 0) localConversations.splice(idx, 1);
  },
  async ask(conversationId: string, question: string): Promise<ChatMessage> {
    const conv = localConversations.find((c) => c.id === conversationId);
    
    // Call real RAG backend
    const res = await apiClient.post("/rag/chat", { question, conversationId });
    const { answer, sources } = res.data;

    const userMsg: ChatMessage = { id: uid(), role: "user", content: question, createdAt: new Date().toISOString() };
    const assistantMsg: ChatMessage = {
      id: uid(),
      role: "assistant",
      content: answer,
      sources: sources,
      createdAt: new Date().toISOString(),
    };

    if (conv) {
      conv.messages.push(userMsg, assistantMsg);
      conv.updatedAt = assistantMsg.createdAt;
    }
    return assistantMsg;
  },
};

/* ------------------------------- Reports --------------------------------- */

export const reportsApi = {
  async borrowReport() {
    return { trend: [], byStatus: [], rows: [] }; // Need aggregation endpoint
  },
  async memberReport() {
    return { byPlan: [], byStatus: [], growth: [], top: [] };
  },
  async bookReport() {
    return { byCategory: [], top: [], lowStock: [] };
  },
  async fineReport() {
    return { byStatus: [], monthly: [], rows: [], total: 0, collected: 0, outstanding: 0 };
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
      books: books.data.items || [],
      members: members.data.items || [],
      documents: docs.data.items || [],
    };
  },
};

export const suggestedQuestions = [
  "What is the late fee for premium members?",
  "How many items can a new member borrow?",
  "When is the library open on weekends?",
];
