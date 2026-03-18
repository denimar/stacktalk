import { agents } from "../seed-data";

describe("seed-data agents", () => {
  it("should have all required fields for every agent", () => {
    for (const agent of agents) {
      expect(agent.name).toBeDefined();
      expect(agent.role).toBeDefined();
      expect(agent.color).toBeDefined();
      expect(agent.kanbanOrder).toBeDefined();
    }
  });

  it("should have unique roles for all agents", () => {
    const roles = agents.map((a) => a.role);
    const uniqueRoles = new Set(roles);
    expect(uniqueRoles.size).toBe(roles.length);
  });
});
