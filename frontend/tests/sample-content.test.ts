import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canUseBundledSamples } from "../src/server/public/sample-content";

describe("bundled sample content", () => {
  it("is available for local development without a database", () => {
    assert.equal(canUseBundledSamples(false, "development"), true);
  });

  it("is never used when a database is configured", () => {
    assert.equal(canUseBundledSamples(true, "development"), false);
    assert.equal(canUseBundledSamples(true, "production"), false);
  });

  it("is not used for production without a database", () => {
    assert.equal(canUseBundledSamples(false, "production"), false);
  });
});
