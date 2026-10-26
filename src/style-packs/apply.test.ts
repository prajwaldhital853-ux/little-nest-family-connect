import { describe, expect, it } from "vitest";

import { applySitePack, quoteFamily } from "./apply";
import { hazelHouse } from "./hazel-house";

describe("applySitePack font names", () => {
  it("writes the pack's own families, quoted", () => {
    applySitePack(hazelHouse);
    const root = document.documentElement.style;
    expect(root.getPropertyValue("--font-heading")).toBe(`"${hazelHouse.typeset.roles.heading.family}"`);
    expect(root.getPropertyValue("--font-meta")).toBe(`"${hazelHouse.typeset.roles.meta.family}"`);
  });

  it("quotes a family whose name has a number in it", () => {
    const heading = { ...hazelHouse.typeset.roles.heading, family: "Goudy Bookletter 1911" };
    applySitePack({ ...hazelHouse, typeset: { ...hazelHouse.typeset, roles: { ...hazelHouse.typeset.roles, heading } } });
    expect(document.documentElement.style.getPropertyValue("--font-heading")).toBe('"Goudy Bookletter 1911"');
  });

  it("never nests quotes", () => {
    expect(quoteFamily('"Arimo"')).toBe('"Arimo"');
  });
});
