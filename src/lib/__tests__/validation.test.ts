import { describe, it, expect } from "vitest";
import { createClaimSchema } from "../validation";

const validClaim = {
  claimantName: "Jane Doe",
  claimantContact: "209-555-0123",
  proofAnswer: "He has a white patch on his left ear.",
};

describe("createClaimSchema kind", () => {
  it("defaults kind to claim when omitted (existing ClaimForm payloads)", () => {
    const parsed = createClaimSchema.parse(validClaim);
    expect(parsed.kind).toBe("claim");
  });

  it("accepts kind: tip", () => {
    const parsed = createClaimSchema.parse({ ...validClaim, kind: "tip" });
    expect(parsed.kind).toBe("tip");
  });

  it("rejects unknown kinds", () => {
    expect(createClaimSchema.safeParse({ ...validClaim, kind: "spam" }).success).toBe(false);
  });

  it("still requires name, contact, and a 10+ character message for tips", () => {
    expect(
      createClaimSchema.safeParse({ ...validClaim, kind: "tip", claimantName: "" }).success
    ).toBe(false);
    expect(
      createClaimSchema.safeParse({ ...validClaim, kind: "tip", claimantContact: "" }).success
    ).toBe(false);
    expect(
      createClaimSchema.safeParse({ ...validClaim, kind: "tip", proofAnswer: "too short" })
        .success
    ).toBe(false);
  });
});
