import { describe, it, expect, jest, beforeEach } from "@jest/globals";

const mockFindUnique = jest.fn<(args: unknown) => Promise<unknown>>();

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: (args: unknown) => mockFindUnique(args),
    },
  },
}));

jest.mock("@/lib/sse-bus", () => {
  const subscribers = new Map<string, Set<(event: unknown) => void>>();
  return {
    __esModule: true,
    default: {
      subscribe: (projectId: string, callback: (event: unknown) => void) => {
        const subs = subscribers.get(projectId) ?? new Set();
        subs.add(callback);
        subscribers.set(projectId, subs);
      },
      unsubscribe: (projectId: string, callback: (event: unknown) => void) => {
        subscribers.get(projectId)?.delete(callback);
      },
      _getSubscribers: (projectId: string) => subscribers.get(projectId),
      _clear: () => subscribers.clear(),
    },
  };
});

const TEST_USER = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  avatar: null,
  role: "owner",
};

function createMockRequest(
  url: string,
  cookies: Record<string, string> = {}
): Request & { cookies: { get: (name: string) => { value: string } | undefined } } {
  const req = new Request(url) as Request & {
    cookies: { get: (name: string) => { value: string } | undefined };
    signal: AbortSignal;
  };
  req.cookies = {
    get: (name: string) => {
      const value = cookies[name];
      return value ? { value } : undefined;
    },
  };
  return req;
}

describe("Feed Stream API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 for unauthenticated requests", async () => {
    const { GET } = await import("@/app/api/feed/stream/route");
    const req = createMockRequest("http://localhost/api/feed/stream?projectId=p1");
    // @ts-expect-error mock request
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("should return 400 when projectId is missing", async () => {
    mockFindUnique.mockResolvedValueOnce(TEST_USER);
    const { GET } = await import("@/app/api/feed/stream/route");
    const req = createMockRequest("http://localhost/api/feed/stream", {
      session_user_id: "user-1",
    });
    // @ts-expect-error mock request
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("should return SSE response with correct headers", async () => {
    mockFindUnique.mockResolvedValueOnce(TEST_USER);
    const { GET } = await import("@/app/api/feed/stream/route");
    const req = createMockRequest(
      "http://localhost/api/feed/stream?projectId=project-1",
      { session_user_id: "user-1" }
    );
    // @ts-expect-error mock request
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    expect(res.headers.get("Cache-Control")).toBe("no-cache");
    expect(res.headers.get("Connection")).toBe("keep-alive");
  });
});
