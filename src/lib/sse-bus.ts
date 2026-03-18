import { SSEEvent } from "@/lib/feed-types";

export type SSESubscriber = (event: SSEEvent) => void;

class SSEBus {
  private subscribers: Map<string, Set<SSESubscriber>> = new Map();

  subscribe(projectId: string, callback: SSESubscriber): void {
    const projectSubscribers = this.subscribers.get(projectId);
    if (projectSubscribers) {
      projectSubscribers.add(callback);
    } else {
      this.subscribers.set(projectId, new Set([callback]));
    }
  }

  unsubscribe(projectId: string, callback: SSESubscriber): void {
    const projectSubscribers = this.subscribers.get(projectId);
    if (!projectSubscribers) return;
    projectSubscribers.delete(callback);
    if (projectSubscribers.size === 0) {
      this.subscribers.delete(projectId);
    }
  }

  publish(event: SSEEvent): void {
    const projectSubscribers = this.subscribers.get(event.projectId);
    if (!projectSubscribers) return;
    for (const callback of projectSubscribers) {
      callback(event);
    }
  }

  getSubscriberCount(projectId: string): number {
    return this.subscribers.get(projectId)?.size ?? 0;
  }
}

const sseBus = new SSEBus();
export default sseBus;
export { SSEBus };
