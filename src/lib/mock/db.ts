import type {
  Activity,
  AppNotification,
  Author,
  Book,
  Borrow,
  Category,
  Conversation,
  Fine,
  LibraryDocument,
  Member,
  Publisher,
  Reservation,
} from "@/lib/types";

/**
 * Deterministic in-memory mock database. Every list survives mutation for the
 * lifetime of the tab, so CRUD flows feel real while remaining backend-free.
 */

const DAY = 86_400_000;
const now = Date.now();
const iso = (offsetDays: number) => new Date(now - offsetDays * DAY).toISOString();

let seed = 42;
const rand = () => {
  seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648;
  return seed / 2_147_483_648;
};
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

export const categories: Category[] = [
  { name: "Fiction", description: "Novels, short stories and literary fiction." },
  { name: "Science", description: "Physics, biology, chemistry and general science." },
  { name: "Technology", description: "Programming, engineering and computing." },
  { name: "History", description: "World history, biographies and memoirs." },
  { name: "Philosophy", description: "Ethics, logic and classic philosophy." },
  { name: "Business", description: "Management, economics and entrepreneurship." },
  { name: "Art & Design", description: "Visual arts, design theory and photography." },
  { name: "Children", description: "Picture books and early readers." },
].map((c, i) => ({
  id: `cat-${i + 1}`,
  ...c,
  bookCount: 0,
  createdAt: iso(400 - i * 12),
}));

export const authors: Author[] = [
  { name: "Ursula K. Le Guin", country: "United States", bio: "Author of speculative fiction exploring anthropology and society." },
  { name: "Carl Sagan", country: "United States", bio: "Astronomer and science communicator." },
  { name: "Robert C. Martin", country: "United States", bio: "Software engineer and author on code craftsmanship." },
  { name: "Yuval Noah Harari", country: "Israel", bio: "Historian focused on macro-history of humankind." },
  { name: "Hannah Arendt", country: "Germany", bio: "Political theorist on power and totalitarianism." },
  { name: "Peter Drucker", country: "Austria", bio: "Father of modern management theory." },
  { name: "Chimamanda Ngozi Adichie", country: "Nigeria", bio: "Novelist of contemporary African literature." },
  { name: "Haruki Murakami", country: "Japan", bio: "Novelist of surreal contemporary fiction." },
  { name: "Mary Beard", country: "United Kingdom", bio: "Classicist and historian of ancient Rome." },
  { name: "Martin Kleppmann", country: "United Kingdom", bio: "Researcher of distributed data systems." },
  { name: "Donella Meadows", country: "United States", bio: "Systems thinker and environmental scientist." },
  { name: "Eric Ries", country: "United States", bio: "Entrepreneur and author of lean methodology." },
].map((a, i) => ({
  id: `auth-${i + 1}`,
  ...a,
  bookCount: 0,
  createdAt: iso(380 - i * 9),
}));

export const publishers: Publisher[] = [
  { name: "Penguin Random House", website: "https://penguinrandomhouse.com", address: "New York, NY" },
  { name: "O'Reilly Media", website: "https://oreilly.com", address: "Sebastopol, CA" },
  { name: "Harper Collins", website: "https://harpercollins.com", address: "New York, NY" },
  { name: "Oxford University Press", website: "https://oup.com", address: "Oxford, UK" },
  { name: "Vintage Books", website: "https://vintage-books.com", address: "London, UK" },
  { name: "MIT Press", website: "https://mitpress.mit.edu", address: "Cambridge, MA" },
].map((p, i) => ({
  id: `pub-${i + 1}`,
  ...p,
  bookCount: 0,
  createdAt: iso(360 - i * 14),
}));

const BOOK_TITLES: ReadonlyArray<readonly [string, string]> = [
  ["The Left Hand of Darkness", "cat-1"],
  ["The Dispossessed", "cat-1"],
  ["Kafka on the Shore", "cat-1"],
  ["Norwegian Wood", "cat-1"],
  ["Half of a Yellow Sun", "cat-1"],
  ["Americanah", "cat-1"],
  ["Cosmos", "cat-2"],
  ["Pale Blue Dot", "cat-2"],
  ["The Demon-Haunted World", "cat-2"],
  ["Thinking in Systems", "cat-2"],
  ["Clean Code", "cat-3"],
  ["Clean Architecture", "cat-3"],
  ["Designing Data-Intensive Applications", "cat-3"],
  ["The Pragmatic Programmer", "cat-3"],
  ["Refactoring at Scale", "cat-3"],
  ["Sapiens", "cat-4"],
  ["Homo Deus", "cat-4"],
  ["SPQR: A History of Ancient Rome", "cat-4"],
  ["21 Lessons for the 21st Century", "cat-4"],
  ["The Origins of Totalitarianism", "cat-5"],
  ["The Human Condition", "cat-5"],
  ["Eichmann in Jerusalem", "cat-5"],
  ["The Effective Executive", "cat-6"],
  ["Innovation and Entrepreneurship", "cat-6"],
  ["The Lean Startup", "cat-6"],
  ["Managing Oneself", "cat-6"],
  ["Ways of Seeing", "cat-7"],
  ["Interaction of Color", "cat-7"],
  ["The Story of Art", "cat-7"],
  ["Where the Wild Things Are", "cat-8"],
  ["The Very Hungry Caterpillar", "cat-8"],
  ["Matilda", "cat-8"],
];

const COVER_COLORS = [
  "#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899",
  "#8b5cf6", "#14b8a6", "#f43f5e", "#84cc16", "#f97316",
] as const;

const CATEGORY_AUTHOR: Record<string, string[]> = {
  "cat-1": ["auth-1", "auth-7", "auth-8"],
  "cat-2": ["auth-2", "auth-11"],
  "cat-3": ["auth-3", "auth-10"],
  "cat-4": ["auth-4", "auth-9"],
  "cat-5": ["auth-5"],
  "cat-6": ["auth-6", "auth-12"],
  "cat-7": ["auth-1", "auth-7"],
  "cat-8": ["auth-7", "auth-8"],
};

export const books: Book[] = BOOK_TITLES.map(([title, categoryId], i) => {
  const authorId = pick(CATEGORY_AUTHOR[categoryId]);
  const author = authors.find((a) => a.id === authorId)!;
  const publisher = publishers[i % publishers.length];
  const category = categories.find((c) => c.id === categoryId)!;
  const totalCopies = int(2, 12);
  const availableCopies = int(0, totalCopies);
  category.bookCount += 1;
  author.bookCount += 1;
  publisher.bookCount += 1;
  return {
    id: `book-${i + 1}`,
    title,
    isbn: `978-${int(100, 999)}-${int(10000, 99999)}-${int(10, 99)}-${int(0, 9)}`,
    categoryId,
    categoryName: category.name,
    authorId,
    authorName: author.name,
    publisherId: publisher.id,
    publisherName: publisher.name,
    publishedYear: int(1965, 2024),
    totalCopies,
    availableCopies,
    shelfLocation: `${category.name[0]}${int(1, 9)}-${int(10, 40)}`,
    language: "English",
    pages: int(120, 720),
    description: `${title} is a cornerstone of the ${category.name.toLowerCase()} collection — frequently requested by members and a staple of reading lists across the library.`,
    coverColor: COVER_COLORS[i % COVER_COLORS.length],
    rating: Math.round((3 + rand() * 2) * 10) / 10,
    borrowCount: int(4, 160),
    status: availableCopies === 0 ? "out-of-stock" : availableCopies <= 2 ? "low-stock" : "available",
    createdAt: iso(int(10, 500)),
  };
});

const FIRST = ["Amelia", "Noah", "Olivia", "Liam", "Sofia", "Ethan", "Maya", "Lucas", "Isla", "Arjun", "Zara", "Felix", "Nadia", "Omar", "Priya", "Hugo", "Lena", "Marcus", "Aisha", "Theo", "Clara", "Ravi", "Elena", "Jonas"] as const;
const LAST = ["Chen", "Okafor", "Petrov", "Silva", "Haddad", "Kim", "Novak", "Ali", "Fernandez", "Larsen", "Tanaka", "Moreau", "Ivanova", "Diallo", "Patel", "Weber"] as const;

export const members: Member[] = Array.from({ length: 36 }, (_, i) => {
  const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 3) % LAST.length]}`;
  const joined = int(20, 700);
  const status = rand() < 0.78 ? "active" : rand() < 0.5 ? "suspended" : "expired";
  return {
    id: `mem-${i + 1}`,
    name,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
    phone: `+1 (${int(200, 989)}) ${int(200, 999)}-${int(1000, 9999)}`,
    address: `${int(10, 990)} ${pick(["Maple", "Cedar", "Oak", "Birch", "Willow"] as const)} ${pick(["St", "Ave", "Blvd", "Lane"] as const)}, ${pick(["Springfield", "Riverton", "Lakeside", "Fairview"] as const)}`,
    status,
    plan: pick(["standard", "premium", "student"] as const),
    joinedAt: iso(joined),
    expiresAt: new Date(now + int(-30, 320) * DAY).toISOString(),
    activeBorrows: 0,
    totalBorrows: 0,
    outstandingFines: 0,
  } satisfies Member;
});

export const borrows: Borrow[] = Array.from({ length: 120 }, (_, i) => {
  const book = books[int(0, books.length - 1)];
  const member = members[int(0, members.length - 1)];
  const issuedDaysAgo = int(0, 180);
  const loanDays = 14 + (rand() < 0.25 ? 14 : 0);
  const dueAt = now - issuedDaysAgo * DAY + loanDays * DAY;
  const returned = rand() < 0.62;
  const overdue = !returned && dueAt < now;
  const returnedAt = returned ? now - int(0, Math.max(1, issuedDaysAgo - 2)) * DAY : null;
  const lateDays = returned
    ? Math.max(0, Math.floor(((returnedAt as number) - dueAt) / DAY))
    : overdue
      ? Math.floor((now - dueAt) / DAY)
      : 0;
  const renewCount = rand() < 0.2 ? int(1, 2) : 0;
  member.totalBorrows += 1;
  if (!returned) member.activeBorrows += 1;
  const fine = lateDays * 0.5;
  if (!returned && fine > 0) member.outstandingFines += fine;
  return {
    id: `bor-${i + 1}`,
    bookId: book.id,
    bookTitle: book.title,
    memberId: member.id,
    memberName: member.name,
    issuedAt: iso(issuedDaysAgo),
    dueAt: new Date(dueAt).toISOString(),
    returnedAt: returnedAt ? new Date(returnedAt).toISOString() : null,
    renewCount,
    fine: Math.round(fine * 100) / 100,
    status: returned ? "returned" : overdue ? "overdue" : renewCount > 0 ? "renewed" : "borrowed",
  } satisfies Borrow;
}).sort((a, b) => +new Date(b.issuedAt) - +new Date(a.issuedAt));

export const fines: Fine[] = borrows
  .filter((b) => b.fine > 0)
  .map((b, i) => ({
    id: `fine-${i + 1}`,
    borrowId: b.id,
    memberId: b.memberId,
    memberName: b.memberName,
    bookTitle: b.bookTitle,
    amount: b.fine,
    reason: `Late return — ${Math.round(b.fine / 0.5)} day(s) overdue`,
    status: b.status === "returned" ? (rand() < 0.8 ? "paid" : "waived") : "unpaid",
    createdAt: b.returnedAt ?? b.dueAt,
  }));

export const reservations: Reservation[] = Array.from({ length: 18 }, (_, i) => {
  const book = books[int(0, books.length - 1)];
  const member = members[int(0, members.length - 1)];
  const reservedDaysAgo = int(0, 30);
  const status = pick(["pending", "pending", "ready", "fulfilled", "cancelled", "expired"] as const);
  return {
    id: `res-${i + 1}`,
    bookId: book.id,
    bookTitle: book.title,
    memberId: member.id,
    memberName: member.name,
    reservedAt: iso(reservedDaysAgo),
    expiresAt: new Date(now + int(1, 14) * DAY).toISOString(),
    status,
    queuePosition: status === "pending" ? int(1, 4) : 0,
  } satisfies Reservation;
});

export const documents: LibraryDocument[] = (
  [
    { name: "Library Policy Handbook 2026.pdf", type: "pdf", pages: 48 },
    { name: "Member Onboarding Guide.pdf", type: "pdf", pages: 12 },
    { name: "Fine & Fee Schedule.pdf", type: "pdf", pages: 6 },
    { name: "Collection Development Policy.docx", type: "docx", pages: 22 },
    { name: "Annual Report 2025.pdf", type: "pdf", pages: 64 },
    { name: "Volunteer Program Overview.docx", type: "docx", pages: 9 },
    { name: "Opening Hours & Holidays.txt", type: "txt", pages: null },
    { name: "Digital Resources Catalog.pdf", type: "pdf", pages: 31 },
    { name: "Floor Plan - Main Branch.png", type: "image", pages: null },
    { name: "Reading Room Rules.txt", type: "txt", pages: null },
  ] satisfies Array<Pick<LibraryDocument, "name" | "type" | "pages">>
).map((d, i) => ({
  id: `doc-${i + 1}`,
  ...d,
  sizeBytes: int(40_000, 8_400_000),
  status: i === 5 ? "processing" : i === 8 ? "failed" : "indexed",
  uploadedBy: pick(["Sarah Whitmore", "James Park", "You"] as const),
  uploadedAt: iso(int(1, 120)),
  chunkCount: d.type === "image" ? 0 : int(8, 220),
}));

export const notifications: AppNotification[] = [
  { type: "overdue", title: "Overdue: Clean Code", message: "Marcus Kim's copy is 4 days overdue. Fine accruing at $0.50/day.", read: false, offset: 0.05 },
  { type: "reservation", title: "Reservation ready", message: "Sapiens is ready for pickup by Amelia Chen. Holds expire in 3 days.", read: false, offset: 0.2 },
  { type: "due", title: "Due tomorrow", message: "3 books are due tomorrow. Consider sending reminders to members.", read: false, offset: 0.6 },
  { type: "member", title: "New member joined", message: "Priya Patel registered with a Premium plan.", read: true, offset: 1.2 },
  { type: "fine", title: "Fine collected", message: "$4.50 collected from Omar Ali for a late return of Cosmos.", read: true, offset: 2.1 },
  { type: "document", title: "Document indexed", message: "Annual Report 2025.pdf was chunked into 220 passages for AI search.", read: true, offset: 3.4 },
  { type: "system", title: "Weekly backup completed", message: "The catalog snapshot completed successfully with no warnings.", read: true, offset: 5 },
].map((n, i) => ({
  id: `ntf-${i + 1}`,
  type: n.type as AppNotification["type"],
  title: n.title,
  message: n.message,
  read: n.read,
  createdAt: iso(n.offset),
}));

export const activities: Activity[] = [
  { type: "borrow", title: "Book issued", description: "Designing Data-Intensive Applications issued to Zara Fernandez", actor: "Sarah Whitmore", offset: 0.04 },
  { type: "return", title: "Book returned", description: "Norwegian Wood returned by Felix Larsen — on time", actor: "James Park", offset: 0.15 },
  { type: "member", title: "Member registered", description: "Priya Patel joined on the Premium plan", actor: "System", offset: 0.5 },
  { type: "fine", title: "Fine paid", description: "$3.00 late fee settled by Hugo Moreau", actor: "Sarah Whitmore", offset: 0.9 },
  { type: "book", title: "New book added", description: "Refactoring at Scale added to Technology (4 copies)", actor: "You", offset: 1.3 },
  { type: "reservation", title: "Reservation placed", description: "Isla Haddad reserved The Lean Startup (queue #2)", actor: "System", offset: 1.8 },
  { type: "document", title: "Document uploaded", description: "Fine & Fee Schedule.pdf uploaded and indexed", actor: "You", offset: 2.4 },
  { type: "return", title: "Book returned late", description: "SPQR returned by Ravi Weber — 3 days late, $1.50 fine", actor: "James Park", offset: 3.1 },
].map((a, i) => ({
  id: `act-${i + 1}`,
  type: a.type as Activity["type"],
  title: a.title,
  description: a.description,
  actor: a.actor,
  createdAt: iso(a.offset),
}));

export const conversations: Conversation[] = [
  {
    id: "conv-1",
    title: "Late fee policy",
    updatedAt: iso(0.3),
    messages: [
      {
        id: "m-1",
        role: "user",
        content: "What is our late fee policy for standard members?",
        createdAt: iso(0.31),
      },
      {
        id: "m-2",
        role: "assistant",
        content:
          "According to the **Fine & Fee Schedule**, standard members are charged **$0.50 per day** per overdue item, capped at **$15.00 per item**.\n\nKey points:\n\n- A 2-day grace period applies before fines start accruing\n- Fines are waived for holidays when the library is closed\n- Members with more than **$10** in outstanding fines cannot borrow new items until settled",
        sources: [
          {
            documentId: "doc-3",
            documentName: "Fine & Fee Schedule.pdf",
            page: 2,
            snippet: "Standard membership: overdue items accrue $0.50 per calendar day following a two-day grace period, to a maximum of $15.00 per item…",
            score: 0.93,
          },
          {
            documentId: "doc-1",
            documentName: "Library Policy Handbook 2026.pdf",
            page: 17,
            snippet: "Borrowing privileges are suspended when a member's outstanding balance exceeds $10.00…",
            score: 0.87,
          },
        ],
        createdAt: iso(0.3),
      },
    ],
  },
  {
    id: "conv-2",
    title: "Renewal limits",
    updatedAt: iso(2),
    messages: [
      { id: "m-3", role: "user", content: "How many times can a book be renewed?", createdAt: iso(2.01) },
      {
        id: "m-4",
        role: "assistant",
        content:
          "Books can be renewed **up to 2 times**, extending the loan by 14 days each, provided no other member has reserved the title.",
        sources: [
          {
            documentId: "doc-1",
            documentName: "Library Policy Handbook 2026.pdf",
            page: 9,
            snippet: "Items may be renewed a maximum of two (2) times unless a hold has been placed by another member…",
            score: 0.91,
          },
        ],
        createdAt: iso(2),
      },
    ],
  },
];

export const borrowTrend = [
  { month: "Aug", borrowed: 132, returned: 118 },
  { month: "Sep", borrowed: 158, returned: 141 },
  { month: "Oct", borrowed: 171, returned: 166 },
  { month: "Nov", borrowed: 149, returned: 155 },
  { month: "Dec", borrowed: 121, returned: 130 },
  { month: "Jan", borrowed: 165, returned: 148 },
  { month: "Feb", borrowed: 182, returned: 170 },
  { month: "Mar", borrowed: 196, returned: 181 },
  { month: "Apr", borrowed: 178, returned: 186 },
  { month: "May", borrowed: 204, returned: 192 },
  { month: "Jun", borrowed: 217, returned: 201 },
  { month: "Jul", borrowed: 188, returned: 176 },
];

export const monthlyStats = [
  { month: "Feb", newMembers: 14, finesCollected: 86, newBooks: 22 },
  { month: "Mar", newMembers: 19, finesCollected: 104, newBooks: 31 },
  { month: "Apr", newMembers: 11, finesCollected: 71, newBooks: 18 },
  { month: "May", newMembers: 23, finesCollected: 129, newBooks: 27 },
  { month: "Jun", newMembers: 17, finesCollected: 95, newBooks: 35 },
  { month: "Jul", newMembers: 21, finesCollected: 112, newBooks: 24 },
];

export const suggestedQuestions = [
  "What is the late fee policy for premium members?",
  "How do I register a new member?",
  "What are the opening hours during holidays?",
  "Summarize the collection development policy",
  "What is the maximum number of renewals allowed?",
  "How are damaged books handled?",
];
