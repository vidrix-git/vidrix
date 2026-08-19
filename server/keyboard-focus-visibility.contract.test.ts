import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("contrato de foco visível", () => {
  const css = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

  it("destaca controles focados por teclado com contorno, halo e superfície diferenciada", () => {
    expect(css).toContain(":focus-visible");
    expect(css).toContain("outline: 3px solid var(--ring) !important");
    expect(css).toContain("outline-offset: 3px !important");
    expect(css).toContain("background-color: color-mix(in oklch, var(--ring) 7%, var(--background)) !important");
  });
});
