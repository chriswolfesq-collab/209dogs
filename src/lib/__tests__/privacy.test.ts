import { describe, expect, it } from "vitest";
import { PUBLIC_DOG_LIST_SELECT } from "@/app/api/dogs/route";
import { PUBLIC_DOG_SELECT } from "@/app/api/dogs/[id]/route";
import { MANAGE_DOG_SELECT } from "@/app/api/manage/[token]/route";

// Guards the app's core privacy invariant (documented in README.md and
// src/app/api/dogs/[id]/route.ts): a finder's email and manage token are
// never returned from a public endpoint, and collarTagInfo — used as a
// claimant verification question — is never exposed publicly either.
const NEVER_PUBLIC = ["finderEmail", "manageToken", "collarTagInfo"];

describe("public dog selects never expose private fields", () => {
  it.each(NEVER_PUBLIC)("PUBLIC_DOG_LIST_SELECT excludes %s", (field) => {
    expect(Object.keys(PUBLIC_DOG_LIST_SELECT)).not.toContain(field);
  });

  it.each(NEVER_PUBLIC)("PUBLIC_DOG_SELECT excludes %s", (field) => {
    expect(Object.keys(PUBLIC_DOG_SELECT)).not.toContain(field);
  });
});

describe("manage select (private, token-gated)", () => {
  it("excludes finderEmail and manageToken (not needed once the token is already known)", () => {
    expect(Object.keys(MANAGE_DOG_SELECT)).not.toContain("finderEmail");
    expect(Object.keys(MANAGE_DOG_SELECT)).not.toContain("manageToken");
  });

  it("does include collarTagInfo — the finder set it and needs to see it to vet claims", () => {
    expect(Object.keys(MANAGE_DOG_SELECT)).toContain("collarTagInfo");
  });
});
