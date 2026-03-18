import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { SSEBus } from "@/lib/sse-bus";
import { SSEEvent } from "@/lib/feed-types";

describe("SSEBus", () => {
  let bus: SSEBus;

  beforeEach(() => {
    bus = new SSEBus();
  });

  it("should deliver event to subscribers of the same projectId", () => {
    const callback = jest.fn();
    const event: SSEEvent = {
      type: "message:created",
      payload: { id: "msg-1", content: "hello" },
      projectId: "project-1",
    };
    bus.subscribe("project-1", callback);
    bus.publish(event);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(event);
  });

  it("should NOT deliver event to subscribers of a different projectId", () => {
    const callback = jest.fn();
    const event: SSEEvent = {
      type: "message:created",
      payload: { id: "msg-1" },
      projectId: "project-1",
    };
    bus.subscribe("project-2", callback);
    bus.publish(event);
    expect(callback).not.toHaveBeenCalled();
  });

  it("should stop delivering events after unsubscribe", () => {
    const callback = jest.fn();
    const event: SSEEvent = {
      type: "message:updated",
      payload: { id: "msg-1" },
      projectId: "project-1",
    };
    bus.subscribe("project-1", callback);
    bus.unsubscribe("project-1", callback);
    bus.publish(event);
    expect(callback).not.toHaveBeenCalled();
  });

  it("should deliver event to multiple subscribers of the same project", () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const event: SSEEvent = {
      type: "thread:reply",
      payload: { id: "msg-2" },
      projectId: "project-1",
    };
    bus.subscribe("project-1", callback1);
    bus.subscribe("project-1", callback2);
    bus.publish(event);
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it("should not throw when publishing with no subscribers", () => {
    const event: SSEEvent = {
      type: "typing",
      payload: { userId: "user-1" },
      projectId: "project-1",
    };
    expect(() => bus.publish(event)).not.toThrow();
  });

  it("should accept all SSEEvent types", () => {
    const callback = jest.fn();
    bus.subscribe("project-1", callback);
    const eventTypes: SSEEvent["type"][] = [
      "message:created",
      "message:updated",
      "thread:reply",
      "typing",
      "presence",
    ];
    for (const type of eventTypes) {
      bus.publish({ type, payload: {}, projectId: "project-1" });
    }
    expect(callback).toHaveBeenCalledTimes(5);
  });

  it("should return correct subscriber count", () => {
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    expect(bus.getSubscriberCount("project-1")).toBe(0);
    bus.subscribe("project-1", cb1);
    expect(bus.getSubscriberCount("project-1")).toBe(1);
    bus.subscribe("project-1", cb2);
    expect(bus.getSubscriberCount("project-1")).toBe(2);
    bus.unsubscribe("project-1", cb1);
    expect(bus.getSubscriberCount("project-1")).toBe(1);
  });

  it("should clean up empty project entries on unsubscribe", () => {
    const callback = jest.fn();
    bus.subscribe("project-1", callback);
    bus.unsubscribe("project-1", callback);
    expect(bus.getSubscriberCount("project-1")).toBe(0);
  });

  it("should handle unsubscribe for non-existent project gracefully", () => {
    const callback = jest.fn();
    expect(() => bus.unsubscribe("nonexistent", callback)).not.toThrow();
  });
});
