import { describe, it, expect, jest, beforeEach } from "@jest/globals";

const mockFindUnique = jest.fn<(args: unknown) => Promise<unknown>>();
const mockFindMany = jest.fn<(args: unknown) => Promise<unknown[]>>();
const mockCreate = jest.fn<(args: unknown) => Promise<unknown>>();
const mockUpdate = jest.fn<(args: unknown) => Promise<unknown>>();
const mockTransaction = jest.fn<(fn: (tx: unknown) => Promise<unknown>) => Promise<unknown>>();
const mockPublish = jest.fn();

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: (args: unknown) => mockFindUnique(args),
    },
    agent: {
      findUnique: (args: unknown) => mockFindUnique(args),
    },
    project: {
      findUnique: (args: unknown) => mockFindUnique(args),
    },
    taskMessage: {
      findMany: (args: unknown) => mockFindMany(args),
      findUnique: (args: unknown) => mockFindUnique(args),
      create: (args: unknown) => mockCreate(args),
      update: (args: unknown) => mockUpdate(args),
    },
    $transaction: (fn: (tx: unknown) => Promise<unknown>) => mockTransaction(fn),
  },
}));

jest.mock("@/lib/sse-bus", () => ({
  __esModule: true,
  default: {
    publish: (event: unknown) => mockPublish(event),
  },
}));

const TEST_USER = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  avatar: null,
  role: "owner",
};

const TEST_MESSAGE = {
  id: "msg-1",
  content: "Hello world",
  authorType: "user" as const,
  authorId: "user-1",
  projectId: "project-1",
  parentMessageId: null,
  replyCount: 0,
  isEdited: false,
  editedAt: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: Record<string, unknown>;
    cookies?: Record<string, string>;
  } = {}
): Request & { cookies: { get: (name: string) => { value: string } | undefined } } {
  const { method = "GET", body, cookies = {} } = options;
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  const req = new Request(url, init) as Request & {
    cookies: { get: (name: string) => { value: string } | undefined };
  };
  req.cookies = {
    get: (name: string) => {
      const value = cookies[name];
      return value ? { value } : undefined;
    },
  };
  return req;
}

describe("Feed Messages API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/feed/messages", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const { GET } = await import("@/app/api/feed/messages/route");
      const req = createMockRequest("http://localhost/api/feed/messages?projectId=p1");
      // @ts-expect-error mock request
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it("should return 400 when projectId is missing", async () => {
      mockFindUnique.mockResolvedValueOnce(TEST_USER);
      const { GET } = await import("@/app/api/feed/messages/route");
      const req = createMockRequest("http://localhost/api/feed/messages", {
        cookies: { session_user_id: "user-1" },
      });
      // @ts-expect-error mock request
      const res = await GET(req);
      expect(res.status).toBe(400);
    });

    it("should return paginated messages", async () => {
      mockFindUnique.mockResolvedValueOnce(TEST_USER);
      mockFindMany.mockResolvedValueOnce([TEST_MESSAGE]);
      mockFindUnique.mockResolvedValueOnce(TEST_USER);
      const { GET } = await import("@/app/api/feed/messages/route");
      const req = createMockRequest(
        "http://localhost/api/feed/messages?projectId=project-1",
        { cookies: { session_user_id: "user-1" } }
      );
      // @ts-expect-error mock request
      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toHaveLength(1);
      expect(json.data[0].content).toBe("Hello world");
      expect(json.hasMore).toBe(false);
    });
  });

  describe("POST /api/feed/messages", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const { POST } = await import("@/app/api/feed/messages/route");
      const req = createMockRequest("http://localhost/api/feed/messages", {
        method: "POST",
        body: { content: "hello", projectId: "p1" },
      });
      // @ts-expect-error mock request
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("should return 400 when content is empty", async () => {
      mockFindUnique.mockResolvedValueOnce(TEST_USER);
      const { POST } = await import("@/app/api/feed/messages/route");
      const req = createMockRequest("http://localhost/api/feed/messages", {
        method: "POST",
        body: { content: "", projectId: "project-1" },
        cookies: { session_user_id: "user-1" },
      });
      // @ts-expect-error mock request
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("should return 400 when projectId is missing", async () => {
      mockFindUnique.mockResolvedValueOnce(TEST_USER);
      const { POST } = await import("@/app/api/feed/messages/route");
      const req = createMockRequest("http://localhost/api/feed/messages", {
        method: "POST",
        body: { content: "hello" },
        cookies: { session_user_id: "user-1" },
      });
      // @ts-expect-error mock request
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("should create a message and publish SSE event", async () => {
      mockFindUnique.mockResolvedValueOnce(TEST_USER);
      mockFindUnique.mockResolvedValueOnce({ id: "project-1", name: "Test" });
      mockTransaction.mockImplementation(async (fn) => {
        const tx = {
          taskMessage: {
            create: () => Promise.resolve(TEST_MESSAGE),
            update: () => Promise.resolve(TEST_MESSAGE),
          },
        };
        return fn(tx);
      });
      const { POST } = await import("@/app/api/feed/messages/route");
      const req = createMockRequest("http://localhost/api/feed/messages", {
        method: "POST",
        body: { content: "Hello world", projectId: "project-1" },
        cookies: { session_user_id: "user-1" },
      });
      // @ts-expect-error mock request
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.content).toBe("Hello world");
      expect(mockPublish).toHaveBeenCalledWith(
        expect.objectContaining({ type: "message:created", projectId: "project-1" })
      );
    });

    it("should create thread reply and publish thread:reply SSE event", async () => {
      mockFindUnique.mockResolvedValueOnce(TEST_USER);
      mockFindUnique.mockResolvedValueOnce({ id: "project-1", name: "Test" });
      mockFindUnique.mockResolvedValueOnce(TEST_MESSAGE);
      const replyMessage = {
        ...TEST_MESSAGE,
        id: "msg-2",
        content: "Reply content",
        parentMessageId: "msg-1",
      };
      mockTransaction.mockImplementation(async (fn) => {
        const tx = {
          taskMessage: {
            create: () => Promise.resolve(replyMessage),
            update: () => Promise.resolve({ ...TEST_MESSAGE, replyCount: 1 }),
          },
        };
        return fn(tx);
      });
      const { POST } = await import("@/app/api/feed/messages/route");
      const req = createMockRequest("http://localhost/api/feed/messages", {
        method: "POST",
        body: {
          content: "Reply content",
          projectId: "project-1",
          parentMessageId: "msg-1",
        },
        cookies: { session_user_id: "user-1" },
      });
      // @ts-expect-error mock request
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(mockPublish).toHaveBeenCalledWith(
        expect.objectContaining({ type: "thread:reply" })
      );
    });
  });

  describe("PUT /api/feed/messages/[id]", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const { PUT } = await import("@/app/api/feed/messages/[id]/route");
      const req = createMockRequest("http://localhost/api/feed/messages/msg-1", {
        method: "PUT",
        body: { content: "updated" },
      });
      // @ts-expect-error mock request
      const res = await PUT(req, { params: Promise.resolve({ id: "msg-1" }) });
      expect(res.status).toBe(401);
    });

    it("should return 403 when editing another user's message", async () => {
      mockFindUnique.mockResolvedValueOnce(TEST_USER);
      mockFindUnique.mockResolvedValueOnce({
        ...TEST_MESSAGE,
        authorId: "other-user",
      });
      const { PUT } = await import("@/app/api/feed/messages/[id]/route");
      const req = createMockRequest("http://localhost/api/feed/messages/msg-1", {
        method: "PUT",
        body: { content: "updated" },
        cookies: { session_user_id: "user-1" },
      });
      // @ts-expect-error mock request
      const res = await PUT(req, { params: Promise.resolve({ id: "msg-1" }) });
      expect(res.status).toBe(403);
    });

    it("should update own message and publish SSE event", async () => {
      mockFindUnique.mockResolvedValueOnce(TEST_USER);
      mockFindUnique.mockResolvedValueOnce(TEST_MESSAGE);
      const updatedMsg = {
        ...TEST_MESSAGE,
        content: "Updated content",
        isEdited: true,
        editedAt: new Date(),
      };
      mockUpdate.mockResolvedValueOnce(updatedMsg);
      const { PUT } = await import("@/app/api/feed/messages/[id]/route");
      const req = createMockRequest("http://localhost/api/feed/messages/msg-1", {
        method: "PUT",
        body: { content: "Updated content" },
        cookies: { session_user_id: "user-1" },
      });
      // @ts-expect-error mock request
      const res = await PUT(req, { params: Promise.resolve({ id: "msg-1" }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.content).toBe("Updated content");
      expect(json.isEdited).toBe(true);
      expect(mockPublish).toHaveBeenCalledWith(
        expect.objectContaining({ type: "message:updated" })
      );
    });

    it("should return 404 when message does not exist", async () => {
      mockFindUnique.mockResolvedValueOnce(TEST_USER);
      mockFindUnique.mockResolvedValueOnce(null);
      const { PUT } = await import("@/app/api/feed/messages/[id]/route");
      const req = createMockRequest("http://localhost/api/feed/messages/nonexistent", {
        method: "PUT",
        body: { content: "updated" },
        cookies: { session_user_id: "user-1" },
      });
      // @ts-expect-error mock request
      const res = await PUT(req, { params: Promise.resolve({ id: "nonexistent" }) });
      expect(res.status).toBe(404);
    });

    it("should return 400 when content is empty", async () => {
      mockFindUnique.mockResolvedValueOnce(TEST_USER);
      const { PUT } = await import("@/app/api/feed/messages/[id]/route");
      const req = createMockRequest("http://localhost/api/feed/messages/msg-1", {
        method: "PUT",
        body: { content: "   " },
        cookies: { session_user_id: "user-1" },
      });
      // @ts-expect-error mock request
      const res = await PUT(req, { params: Promise.resolve({ id: "msg-1" }) });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/feed/messages/[id]/replies", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const { GET } = await import("@/app/api/feed/messages/[id]/replies/route");
      const req = createMockRequest("http://localhost/api/feed/messages/msg-1/replies");
      // @ts-expect-error mock request
      const res = await GET(req, { params: Promise.resolve({ id: "msg-1" }) });
      expect(res.status).toBe(401);
    });

    it("should return 404 when parent message does not exist", async () => {
      mockFindUnique.mockResolvedValueOnce(TEST_USER);
      mockFindUnique.mockResolvedValueOnce(null);
      const { GET } = await import("@/app/api/feed/messages/[id]/replies/route");
      const req = createMockRequest("http://localhost/api/feed/messages/nonexistent/replies", {
        cookies: { session_user_id: "user-1" },
      });
      // @ts-expect-error mock request
      const res = await GET(req, { params: Promise.resolve({ id: "nonexistent" }) });
      expect(res.status).toBe(404);
    });

    it("should return thread replies", async () => {
      mockFindUnique.mockResolvedValueOnce(TEST_USER);
      mockFindUnique.mockResolvedValueOnce(TEST_MESSAGE);
      const reply = {
        ...TEST_MESSAGE,
        id: "msg-2",
        content: "A reply",
        parentMessageId: "msg-1",
      };
      mockFindMany.mockResolvedValueOnce([reply]);
      mockFindUnique.mockResolvedValueOnce(TEST_USER);
      const { GET } = await import("@/app/api/feed/messages/[id]/replies/route");
      const req = createMockRequest("http://localhost/api/feed/messages/msg-1/replies", {
        cookies: { session_user_id: "user-1" },
      });
      // @ts-expect-error mock request
      const res = await GET(req, { params: Promise.resolve({ id: "msg-1" }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toHaveLength(1);
      expect(json.data[0].content).toBe("A reply");
    });
  });
});
