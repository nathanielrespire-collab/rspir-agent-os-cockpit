import { describe, it, expect } from "vitest";
import { VALID_TRANSITIONS, validateTransition } from "@/lib/store";

describe("VALID_TRANSITIONS", () => {
  it("covers all 9 work statuses", () => {
    const statuses = [
      "todo", "ready", "claimed", "running", "verification",
      "a_valider", "blocked", "failed", "done",
    ] as const;
    statuses.forEach((s) => {
      expect(VALID_TRANSITIONS).toHaveProperty(s);
      expect(Array.isArray(VALID_TRANSITIONS[s])).toBe(true);
    });
  });

  it("done is a terminal state with no outgoing transitions", () => {
    expect(VALID_TRANSITIONS.done).toHaveLength(0);
  });

  it("a_valider can transition to done or running", () => {
    expect(VALID_TRANSITIONS.a_valider).toContain("done");
    expect(VALID_TRANSITIONS.a_valider).toContain("running");
  });

  it("todo can only transition to ready", () => {
    expect(VALID_TRANSITIONS.todo).toEqual(["ready"]);
  });
});

describe("validateTransition", () => {
  it("allows valid transition: todo → ready", () => {
    const result = validateTransition("todo", "ready", false);
    expect(result.ok).toBe(true);
  });

  it("rejects invalid transition: todo → done", () => {
    const result = validateTransition("todo", "done", true);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("invalid_transition");
  });

  it("rejects invalid transition: done → todo (terminal state)", () => {
    const result = validateTransition("done", "todo", true);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("invalid_transition");
  });

  it("rejects done without evidence: a_valider → done, no evidence", () => {
    const result = validateTransition("a_valider", "done", false);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("evidence_required");
  });

  it("allows done with evidence: a_valider → done, has evidence", () => {
    const result = validateTransition("a_valider", "done", true);
    expect(result.ok).toBe(true);
  });

  it("rejects invalid transition even with evidence: running → done", () => {
    const result = validateTransition("running", "done", true);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("invalid_transition");
  });

  it("allows blocked → ready", () => {
    const result = validateTransition("blocked", "ready", false);
    expect(result.ok).toBe(true);
  });

  it("allows failed → todo (retry path)", () => {
    const result = validateTransition("failed", "todo", false);
    expect(result.ok).toBe(true);
  });

  it("rejects failed → done (invalid direct shortcut)", () => {
    const result = validateTransition("failed", "done", true);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("invalid_transition");
  });
});
