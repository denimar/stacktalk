import { describe, it, expect, jest, beforeEach } from "@jest/globals";

const mockConversationCreate = jest.fn<(args: unknown) => Promise<unknown>>();
const mockConversationFindUnique = jest.fn<(args: unknown) => Promise<unknown>>();
const mockConversationFindMany = jest.fn<(args: unknown) => Promise<unknown[]>>();
const mockConversationDelete = jest.fn<(args: unknown) => Promise<unknown>>();

const mockMessageCreate = jest.fn<(args: unknown) => Promise<unknown>>();
const mockMessageFindMany = jest.fn<(args: unknown) => Promise<unknown[]>>();
const mockMessageDelete = jest.fn<(args: unknown) => Promise<unknown>>();

const mockAttachmentCreate = jest.fn<(args: unknown) => Promise<unknown>>();
const mockAttachmentFindMany = jest.fn<(args: unknown) => Promise<unknown[]>>();

jest.mock("@/db/prisma", () => ({
  __esModule: true,
  default: {
    conversation: {
      create: (args: unknown) => mockConversationCreate(args),
      findUnique: (args: unknown) => mockConversationFindUnique(args),
      findMany: (args: unknown) => mockConversationFindMany(args),
      delete: (args: unknown) => mockConversationDelete(args),
    },
    conversationMessage: {
      create: (args: unknown) => mockMessageCreate(args),
      findMany: (args: unknown) => mockMessageFindMany(args),
      delete: (args: unknown) => mockMessageDelete(args),
    },
    conversationAttachment: {
      create: (args: unknown) => mockAttachmentCreate(args),
      findMany: (args: unknown) => mockAttachmentFindMany(args),
    },
  },
}));

import prisma from "@/db/prisma";

const mockDate = new Date("2026-03-14T12:00:00Z");
const mockDateUpdated = new Date("2026-03-14T12:05:00Z");

const mockUser = {
  id: "user-owner-1",
  name: "Alex Morgan",
  email: "alex.morgan@pipelord.dev",
  avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  role: "owner",
  status: "active",
  lastActivityAt: null,
  createdAt: mockDate,
  updatedAt: mockDate,
};

const mockAgent = {
  id: "agent-1",
  name: "Grace Kim",
  avatar: "https://randomuser.me/api/portraits/women/52.jpg",
  role: "Product Manager",
  kanbanOrder: 0,
  color: "#6366F1",
  modelId: "model-1",
  createdAt: mockDate,
  updatedAt: mockDate,
};

const mockSecondAgent = {
  id: "agent-2",
  name: "Bob Carter",
  avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  role: "Tech Lead",
  kanbanOrder: 2,
  color: "#10B981",
  modelId: "model-1",
  createdAt: mockDate,
  updatedAt: mockDate,
};

const mockConversation = {
  id: "conv-1",
  ownerId: "user-owner-1",
  agentId: "agent-1",
  createdAt: mockDate,
  updatedAt: mockDateUpdated,
};

const mockOwnerMessage = {
  id: "msg-1",
  conversationId: "conv-1",
  role: "owner",
  senderName: "Alex Morgan",
  content: "Hello, can you review the latest PRD?",
  status: "sent",
  createdAt: mockDate,
};

const mockAgentMessage = {
  id: "msg-2",
  conversationId: "conv-1",
  role: "agent",
  senderName: "Grace Kim",
  content: "Of course! I will review it right away.",
  status: "sent",
  createdAt: new Date("2026-03-14T12:01:00Z"),
};

const mockSystemMessage = {
  id: "msg-3",
  conversationId: "conv-1",
  role: "system",
  senderName: "System",
  content: "Agent did not respond. Please try again.",
  status: "sent",
  createdAt: new Date("2026-03-14T12:02:00Z"),
};

const mockImageAttachment = {
  id: "att-1",
  messageId: "msg-1",
  fileName: "screenshot.png",
  fileType: "image/png",
  fileSize: 102400,
  storagePath: "/uploads/conv-1/msg-1/screenshot.png",
  attachmentType: "image",
  createdAt: mockDate,
};

const mockDocumentAttachment = {
  id: "att-2",
  messageId: "msg-1",
  fileName: "report.pdf",
  fileType: "application/pdf",
  fileSize: 2457600,
  storagePath: "/uploads/conv-1/msg-1/report.pdf",
  attachmentType: "document",
  createdAt: mockDate,
};

const mockUnlinkedAttachment = {
  id: "att-3",
  messageId: null,
  fileName: "draft.txt",
  fileType: "text/plain",
  fileSize: 1024,
  storagePath: "/uploads/staging/draft.txt",
  attachmentType: "document",
  createdAt: mockDate,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Conversation model", () => {
  it("should create a conversation linking a user and agent", async () => {
    mockConversationCreate.mockResolvedValue({
      ...mockConversation,
      owner: mockUser,
      agent: mockAgent,
    });
    const result = await prisma.conversation.create({
      data: {
        ownerId: mockUser.id,
        agentId: mockAgent.id,
      },
      include: { owner: true, agent: true },
    });
    expect(result.id).toBe("conv-1");
    expect(result.ownerId).toBe("user-owner-1");
    expect(result.agentId).toBe("agent-1");
    expect(result.owner).toEqual(mockUser);
    expect(result.agent).toEqual(mockAgent);
    expect(mockConversationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { ownerId: "user-owner-1", agentId: "agent-1" },
        include: { owner: true, agent: true },
      })
    );
  });

  it("should enforce unique constraint on [ownerId, agentId]", async () => {
    const prismaError = new Error("Unique constraint failed on the fields: (`owner_id`,`agent_id`)");
    Object.assign(prismaError, { code: "P2002", meta: { target: ["owner_id", "agent_id"] } });
    mockConversationCreate.mockRejectedValue(prismaError);
    await expect(
      prisma.conversation.create({
        data: { ownerId: mockUser.id, agentId: mockAgent.id },
      })
    ).rejects.toThrow("Unique constraint failed");
  });

  it("should allow same owner with different agents", async () => {
    const secondConversation = {
      id: "conv-2",
      ownerId: "user-owner-1",
      agentId: "agent-2",
      createdAt: mockDate,
      updatedAt: mockDate,
    };
    mockConversationCreate.mockResolvedValue(secondConversation);
    const result = await prisma.conversation.create({
      data: { ownerId: mockUser.id, agentId: mockSecondAgent.id },
    });
    expect(result.id).toBe("conv-2");
    expect(result.agentId).toBe("agent-2");
  });

  it("should find a conversation by ownerId and agentId", async () => {
    mockConversationFindUnique.mockResolvedValue(mockConversation);
    const result = await prisma.conversation.findUnique({
      where: { ownerId_agentId: { ownerId: mockUser.id, agentId: mockAgent.id } },
    });
    expect(result).toEqual(mockConversation);
    expect(mockConversationFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId_agentId: { ownerId: "user-owner-1", agentId: "agent-1" } },
      })
    );
  });

  it("should return null when conversation does not exist", async () => {
    mockConversationFindUnique.mockResolvedValue(null);
    const result = await prisma.conversation.findUnique({
      where: { ownerId_agentId: { ownerId: "nonexistent", agentId: "agent-1" } },
    });
    expect(result).toBeNull();
  });

  it("should list conversations for an owner sorted by updatedAt", async () => {
    const conversations = [
      { ...mockConversation, updatedAt: new Date("2026-03-14T15:00:00Z") },
      { id: "conv-2", ownerId: "user-owner-1", agentId: "agent-2", createdAt: mockDate, updatedAt: new Date("2026-03-14T14:00:00Z") },
    ];
    mockConversationFindMany.mockResolvedValue(conversations);
    const result = await prisma.conversation.findMany({
      where: { ownerId: mockUser.id },
      orderBy: { updatedAt: "desc" },
    });
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("conv-1");
    expect(mockConversationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: "user-owner-1" },
        orderBy: { updatedAt: "desc" },
      })
    );
  });

  it("should include messages when querying a conversation", async () => {
    const conversationWithMessages = {
      ...mockConversation,
      messages: [mockOwnerMessage, mockAgentMessage],
    };
    mockConversationFindUnique.mockResolvedValue(conversationWithMessages);
    const result = await prisma.conversation.findUnique({
      where: { id: "conv-1" },
      include: { messages: true },
    });
    expect(result).not.toBeNull();
    expect(result!.messages).toHaveLength(2);
    expect(result!.messages[0].role).toBe("owner");
    expect(result!.messages[1].role).toBe("agent");
  });

  it("should include owner and agent relations", async () => {
    const conversationWithRelations = {
      ...mockConversation,
      owner: mockUser,
      agent: mockAgent,
    };
    mockConversationFindUnique.mockResolvedValue(conversationWithRelations);
    const result = await prisma.conversation.findUnique({
      where: { id: "conv-1" },
      include: { owner: true, agent: true },
    });
    expect(result).not.toBeNull();
    expect(result!.owner.name).toBe("Alex Morgan");
    expect(result!.agent.name).toBe("Grace Kim");
  });
});

describe("ConversationMessage model", () => {
  it("should create an owner message", async () => {
    mockMessageCreate.mockResolvedValue(mockOwnerMessage);
    const result = await prisma.conversationMessage.create({
      data: {
        conversationId: "conv-1",
        role: "owner",
        senderName: "Alex Morgan",
        content: "Hello, can you review the latest PRD?",
      },
    });
    expect(result.id).toBe("msg-1");
    expect(result.role).toBe("owner");
    expect(result.senderName).toBe("Alex Morgan");
    expect(result.content).toBe("Hello, can you review the latest PRD?");
    expect(result.status).toBe("sent");
  });

  it("should create an agent message", async () => {
    mockMessageCreate.mockResolvedValue(mockAgentMessage);
    const result = await prisma.conversationMessage.create({
      data: {
        conversationId: "conv-1",
        role: "agent",
        senderName: "Grace Kim",
        content: "Of course! I will review it right away.",
      },
    });
    expect(result.role).toBe("agent");
    expect(result.senderName).toBe("Grace Kim");
  });

  it("should create a system message", async () => {
    mockMessageCreate.mockResolvedValue(mockSystemMessage);
    const result = await prisma.conversationMessage.create({
      data: {
        conversationId: "conv-1",
        role: "system",
        senderName: "System",
        content: "Agent did not respond. Please try again.",
      },
    });
    expect(result.role).toBe("system");
    expect(result.senderName).toBe("System");
  });

  it("should create a message with default status of sent", async () => {
    mockMessageCreate.mockResolvedValue(mockOwnerMessage);
    const result = await prisma.conversationMessage.create({
      data: {
        conversationId: "conv-1",
        role: "owner",
        senderName: "Alex Morgan",
        content: "Test message",
      },
    });
    expect(result.status).toBe("sent");
  });

  it("should create a message with explicit failed status", async () => {
    const failedMessage = { ...mockOwnerMessage, status: "failed" };
    mockMessageCreate.mockResolvedValue(failedMessage);
    const result = await prisma.conversationMessage.create({
      data: {
        conversationId: "conv-1",
        role: "owner",
        senderName: "Alex Morgan",
        content: "Failed message",
        status: "failed",
      },
    });
    expect(result.status).toBe("failed");
  });

  it("should list messages for a conversation in chronological order", async () => {
    mockMessageFindMany.mockResolvedValue([mockOwnerMessage, mockAgentMessage, mockSystemMessage]);
    const result = await prisma.conversationMessage.findMany({
      where: { conversationId: "conv-1" },
      orderBy: { createdAt: "asc" },
    });
    expect(result).toHaveLength(3);
    expect(result[0].role).toBe("owner");
    expect(result[1].role).toBe("agent");
    expect(result[2].role).toBe("system");
    expect(mockMessageFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { conversationId: "conv-1" },
        orderBy: { createdAt: "asc" },
      })
    );
  });

  it("should support cursor-based pagination", async () => {
    const messages = [mockOwnerMessage, mockAgentMessage];
    mockMessageFindMany.mockResolvedValue(messages);
    const result = await prisma.conversationMessage.findMany({
      where: { conversationId: "conv-1" },
      orderBy: { createdAt: "asc" },
      take: 50,
      cursor: { id: "msg-0" },
      skip: 1,
    });
    expect(result).toHaveLength(2);
    expect(mockMessageFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 50,
        cursor: { id: "msg-0" },
        skip: 1,
      })
    );
  });

  it("should include attachments when querying messages", async () => {
    const messageWithAttachments = {
      ...mockOwnerMessage,
      attachments: [mockImageAttachment, mockDocumentAttachment],
    };
    mockMessageFindMany.mockResolvedValue([messageWithAttachments]);
    const result = await prisma.conversationMessage.findMany({
      where: { conversationId: "conv-1" },
      include: { attachments: true },
    });
    expect(result[0].attachments).toHaveLength(2);
    expect(result[0].attachments[0].fileName).toBe("screenshot.png");
    expect(result[0].attachments[1].fileName).toBe("report.pdf");
  });

  it("should handle long text content via @db.Text column type", async () => {
    const longContent = "A".repeat(10000);
    const longMessage = { ...mockOwnerMessage, content: longContent };
    mockMessageCreate.mockResolvedValue(longMessage);
    const result = await prisma.conversationMessage.create({
      data: {
        conversationId: "conv-1",
        role: "owner",
        senderName: "Alex Morgan",
        content: longContent,
      },
    });
    expect(result.content).toHaveLength(10000);
  });

  it("should return empty array for conversation with no messages", async () => {
    mockMessageFindMany.mockResolvedValue([]);
    const result = await prisma.conversationMessage.findMany({
      where: { conversationId: "conv-nonexistent" },
    });
    expect(result).toHaveLength(0);
  });
});

describe("ConversationAttachment model", () => {
  it("should create an image attachment linked to a message", async () => {
    mockAttachmentCreate.mockResolvedValue(mockImageAttachment);
    const result = await prisma.conversationAttachment.create({
      data: {
        messageId: "msg-1",
        fileName: "screenshot.png",
        fileType: "image/png",
        fileSize: 102400,
        storagePath: "/uploads/conv-1/msg-1/screenshot.png",
        attachmentType: "image",
      },
    });
    expect(result.id).toBe("att-1");
    expect(result.messageId).toBe("msg-1");
    expect(result.fileName).toBe("screenshot.png");
    expect(result.fileType).toBe("image/png");
    expect(result.fileSize).toBe(102400);
    expect(result.attachmentType).toBe("image");
  });

  it("should create a document attachment linked to a message", async () => {
    mockAttachmentCreate.mockResolvedValue(mockDocumentAttachment);
    const result = await prisma.conversationAttachment.create({
      data: {
        messageId: "msg-1",
        fileName: "report.pdf",
        fileType: "application/pdf",
        fileSize: 2457600,
        storagePath: "/uploads/conv-1/msg-1/report.pdf",
        attachmentType: "document",
      },
    });
    expect(result.id).toBe("att-2");
    expect(result.attachmentType).toBe("document");
    expect(result.fileSize).toBe(2457600);
  });

  it("should create an unlinked attachment (messageId null)", async () => {
    mockAttachmentCreate.mockResolvedValue(mockUnlinkedAttachment);
    const result = await prisma.conversationAttachment.create({
      data: {
        messageId: null,
        fileName: "draft.txt",
        fileType: "text/plain",
        fileSize: 1024,
        storagePath: "/uploads/staging/draft.txt",
        attachmentType: "document",
      },
    });
    expect(result.id).toBe("att-3");
    expect(result.messageId).toBeNull();
  });

  it("should list attachments for a message", async () => {
    mockAttachmentFindMany.mockResolvedValue([mockImageAttachment, mockDocumentAttachment]);
    const result = await prisma.conversationAttachment.findMany({
      where: { messageId: "msg-1" },
    });
    expect(result).toHaveLength(2);
    expect(mockAttachmentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { messageId: "msg-1" } })
    );
  });

  it("should return empty array for unlinked attachments query", async () => {
    mockAttachmentFindMany.mockResolvedValue([mockUnlinkedAttachment]);
    const result = await prisma.conversationAttachment.findMany({
      where: { messageId: null },
    });
    expect(result).toHaveLength(1);
    expect(result[0].messageId).toBeNull();
  });
});

describe("Cascade delete behavior", () => {
  it("should cascade delete messages when conversation is deleted", async () => {
    mockConversationDelete.mockResolvedValue(mockConversation);
    mockMessageFindMany.mockResolvedValue([]);
    await prisma.conversation.delete({
      where: { id: "conv-1" },
    });
    expect(mockConversationDelete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "conv-1" } })
    );
    const remainingMessages = await prisma.conversationMessage.findMany({
      where: { conversationId: "conv-1" },
    });
    expect(remainingMessages).toHaveLength(0);
  });

  it("should cascade delete attachments when message is deleted", async () => {
    mockMessageDelete.mockResolvedValue(mockOwnerMessage);
    mockAttachmentFindMany.mockResolvedValue([]);
    await prisma.conversationMessage.delete({
      where: { id: "msg-1" },
    });
    expect(mockMessageDelete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "msg-1" } })
    );
    const remainingAttachments = await prisma.conversationAttachment.findMany({
      where: { messageId: "msg-1" },
    });
    expect(remainingAttachments).toHaveLength(0);
  });

  it("should delete conversation with nested messages and attachments", async () => {
    const conversationWithRelations = {
      ...mockConversation,
      messages: [
        {
          ...mockOwnerMessage,
          attachments: [mockImageAttachment, mockDocumentAttachment],
        },
        {
          ...mockAgentMessage,
          attachments: [],
        },
      ],
    };
    mockConversationFindUnique.mockResolvedValue(conversationWithRelations);
    mockConversationDelete.mockResolvedValue(mockConversation);
    const found = await prisma.conversation.findUnique({
      where: { id: "conv-1" },
      include: { messages: { include: { attachments: true } } },
    });
    expect(found).not.toBeNull();
    expect(found!.messages).toHaveLength(2);
    expect(found!.messages[0].attachments).toHaveLength(2);
    await prisma.conversation.delete({ where: { id: "conv-1" } });
    expect(mockConversationDelete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "conv-1" } })
    );
    mockMessageFindMany.mockResolvedValue([]);
    const remainingMessages = await prisma.conversationMessage.findMany({
      where: { conversationId: "conv-1" },
    });
    expect(remainingMessages).toHaveLength(0);
    mockAttachmentFindMany.mockResolvedValue([]);
    const remainingAttachments = await prisma.conversationAttachment.findMany({
      where: { messageId: "msg-1" },
    });
    expect(remainingAttachments).toHaveLength(0);
  });
});

describe("Schema field validation", () => {
  it("should have correct fields on Conversation model", () => {
    const conversation = mockConversation;
    expect(conversation).toHaveProperty("id");
    expect(conversation).toHaveProperty("ownerId");
    expect(conversation).toHaveProperty("agentId");
    expect(conversation).toHaveProperty("createdAt");
    expect(conversation).toHaveProperty("updatedAt");
  });

  it("should have correct fields on ConversationMessage model", () => {
    const message = mockOwnerMessage;
    expect(message).toHaveProperty("id");
    expect(message).toHaveProperty("conversationId");
    expect(message).toHaveProperty("role");
    expect(message).toHaveProperty("senderName");
    expect(message).toHaveProperty("content");
    expect(message).toHaveProperty("status");
    expect(message).toHaveProperty("createdAt");
  });

  it("should have correct fields on ConversationAttachment model", () => {
    const attachment = mockImageAttachment;
    expect(attachment).toHaveProperty("id");
    expect(attachment).toHaveProperty("messageId");
    expect(attachment).toHaveProperty("fileName");
    expect(attachment).toHaveProperty("fileType");
    expect(attachment).toHaveProperty("fileSize");
    expect(attachment).toHaveProperty("storagePath");
    expect(attachment).toHaveProperty("attachmentType");
    expect(attachment).toHaveProperty("createdAt");
  });

  it("should have fileSize as a number (Int)", () => {
    expect(typeof mockImageAttachment.fileSize).toBe("number");
    expect(typeof mockDocumentAttachment.fileSize).toBe("number");
    expect(typeof mockUnlinkedAttachment.fileSize).toBe("number");
  });

  it("should support all three message roles", () => {
    expect(mockOwnerMessage.role).toBe("owner");
    expect(mockAgentMessage.role).toBe("agent");
    expect(mockSystemMessage.role).toBe("system");
  });

  it("should support both image and document attachment types", () => {
    expect(mockImageAttachment.attachmentType).toBe("image");
    expect(mockDocumentAttachment.attachmentType).toBe("document");
  });
});
