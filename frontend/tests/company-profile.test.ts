import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveSections, SECTION_KEYS, visibleSections } from "../src/lib/company-sections";
import { ITEM_SCHEMAS } from "../src/server/validation/company-items";
import { companyUpdateSchema, profileSectionsSchema } from "../src/server/validation/company";

describe("company page sections", () => {
  it("defaults to every section in the standard order", () => {
    const sections = resolveSections(null);
    assert.deepEqual(sections.map((s) => s.key), [...SECTION_KEYS]);
    assert.equal(sections[0].label, "Overview");
  });
  it("keeps a company's own order, labels and switches, and appends new sections", () => {
    const sections = resolveSections([
      { key: "gallery", enabled: true, label: "Photos" },
      { key: "about", enabled: false },
      { key: "overview", enabled: true },
    ]);
    assert.deepEqual(sections.slice(0, 3).map((s) => s.key), ["gallery", "about", "overview"]);
    assert.equal(sections[0].label, "Photos");
    assert.equal(sections[1].enabled, false);
    assert.equal(sections.length, SECTION_KEYS.length);
  });
  it("never turns off Overview or Get in touch", () => {
    const sections = resolveSections([{ key: "overview", enabled: false }, { key: "contact", enabled: false }]);
    assert.ok(sections.find((s) => s.key === "overview")!.enabled);
    assert.ok(sections.find((s) => s.key === "contact")!.enabled);
  });
  it("ignores unknown or repeated entries from storage", () => {
    const sections = resolveSections([{ key: "admin" }, { key: "news", enabled: false }, { key: "news", enabled: true }, "x", null]);
    assert.equal(sections.filter((s) => s.key === "news").length, 1);
    assert.equal(sections.find((s) => s.key === "news")!.enabled, false);
  });
  it("names the services section after the company's title", () => {
    assert.equal(resolveSections(null, "Products").find((s) => s.key === "services")!.label, "Products");
    assert.equal(resolveSections([{ key: "services", enabled: true, label: "Solutions" }], "Products").find((s) => s.key === "services")!.label, "Solutions");
  });
  it("hides empty optional sections unless asked to show them", () => {
    const sections = resolveSections([{ key: "projects", enabled: true, showEmpty: true }, { key: "gallery", enabled: false, showEmpty: true }]);
    const shown = visibleSections(sections, { news: true }).map((s) => s.key);
    assert.ok(shown.includes("projects"), "shown when empty by choice");
    assert.ok(shown.includes("news"), "has content");
    assert.ok(!shown.includes("gallery"), "switched off");
    assert.ok(!shown.includes("businesses"), "empty and not chosen");
    assert.ok(shown.includes("overview") && shown.includes("contact"));
  });
});

describe("company profile validation", () => {
  it("accepts section settings and refuses duplicates or unknown keys", () => {
    assert.equal(profileSectionsSchema.safeParse([{ key: "news", enabled: false }]).success, true);
    assert.equal(profileSectionsSchema.safeParse([{ key: "news", enabled: false }, { key: "news", enabled: true }]).success, false);
    assert.equal(profileSectionsSchema.safeParse([{ key: "settings", enabled: true }]).success, false);
  });
  it("only allows Google Maps links for directions", () => {
    assert.equal(companyUpdateSchema.safeParse({ mapUrl: "https://maps.app.goo.gl/abc123" }).success, true);
    assert.equal(companyUpdateSchema.safeParse({ mapUrl: "https://www.google.com/maps/place/Pokhara" }).success, true);
    assert.equal(companyUpdateSchema.safeParse({ mapUrl: "https://evil.example/maps" }).success, false);
    assert.equal(companyUpdateSchema.safeParse({ mapUrl: "javascript:alert(1)" }).success, false);
  });
  it("keeps the company out of a record's body", () => {
    assert.equal(ITEM_SCHEMAS.offerings.create.safeParse({ title: "Cardiology" }).success, true);
    assert.equal(ITEM_SCHEMAS.offerings.create.safeParse({ title: "Cardiology", companyId: "6f1c1c3e-1b1a-4c55-9c39-111111111111" }).success, false);
  });
  it("reserves the preview address", () => {
    assert.equal(ITEM_SCHEMAS.offerings.create.safeParse({ title: "Preview", slug: "preview" }).success, false);
  });
  it("needs a name or a group company for a related business", () => {
    assert.equal(ITEM_SCHEMAS.relations.create.safeParse({ relationType: "BRAND" }).success, false);
    assert.equal(ITEM_SCHEMAS.relations.create.safeParse({ relationType: "BRAND", name: "Sanjeevani Pharmacy" }).success, true);
  });
  it("refuses unsafe website links", () => {
    assert.equal(ITEM_SCHEMAS.relations.create.safeParse({ relationType: "PARTNER", name: "X", websiteUrl: "javascript:alert(1)" }).success, false);
  });
});
