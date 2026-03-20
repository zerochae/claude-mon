import { describe, expect, it } from "vitest";

import {
  extraUsageFillStyle,
  formatTokens,
  shortenHome,
} from "@/utils/detail.utils";

describe("extraUsageFillStyle", () => {
  it("returns width as percentage of utilization", () => {
    expect(extraUsageFillStyle(50).width).toBe("50%");
  });

  it("clamps width to 100% when utilization exceeds 100", () => {
    expect(extraUsageFillStyle(150).width).toBe("100%");
  });

  it("returns 100% width at exactly 100 utilization", () => {
    expect(extraUsageFillStyle(100).width).toBe("100%");
  });

  it("returns 0% width at zero utilization", () => {
    expect(extraUsageFillStyle(0).width).toBe("0%");
  });

  it("always returns orange background color", () => {
    expect(extraUsageFillStyle(50).background).toBe("var(--colors-orange)");
    expect(extraUsageFillStyle(0).background).toBe("var(--colors-orange)");
  });
});

describe("formatTokens", () => {
  it("returns plain number string below 1000", () => {
    expect(formatTokens(0)).toBe("0");
    expect(formatTokens(999)).toBe("999");
    expect(formatTokens(1)).toBe("1");
  });

  it("formats thousands with k suffix", () => {
    expect(formatTokens(1000)).toBe("1.0k");
    expect(formatTokens(1500)).toBe("1.5k");
    expect(formatTokens(999_999)).toBe("1000.0k");
  });

  it("formats millions with M suffix", () => {
    expect(formatTokens(1_000_000)).toBe("1.0M");
    expect(formatTokens(2_500_000)).toBe("2.5M");
  });

  it("formats large millions with one decimal", () => {
    expect(formatTokens(10_000_000)).toBe("10.0M");
  });
});

describe("shortenHome", () => {
  it("replaces /Users/<name> prefix with ~", () => {
    expect(shortenHome("/Users/alice/projects/foo")).toBe("~/projects/foo");
  });

  it("replaces /home/<name> prefix with ~", () => {
    expect(shortenHome("/home/alice/projects/foo")).toBe("~/projects/foo");
  });

  it("leaves paths without home prefix unchanged", () => {
    expect(shortenHome("/tmp/foo")).toBe("/tmp/foo");
    expect(shortenHome("/var/data")).toBe("/var/data");
  });

  it("handles path that is exactly the home directory", () => {
    expect(shortenHome("/Users/alice")).toBe("~");
  });

  it("does not replace mid-path occurrences of Users or home", () => {
    expect(shortenHome("/data/Users/alice")).toBe("/data/Users/alice");
  });
});
