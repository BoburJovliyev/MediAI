import { describe, it, expect, vi } from "vitest";
import { buildDirectionsUrl } from "@/lib/navigation";

// sonner is imported by navigation.ts; stub it so no real toasts fire.
vi.mock("sonner", () => ({ toast: { error: vi.fn(), info: vi.fn() } }));

describe("buildDirectionsUrl", () => {
  it("uses precise coordinates when available", () => {
    const url = buildDirectionsUrl({ coords: "41.311081,69.240562", name: "Klinika", address: "Toshkent" });
    expect(url).toContain("https://www.google.com/maps/dir/?");
    expect(url).toContain("api=1");
    expect(url).toContain("travelmode=driving");
    // coordinates preferred over the text query
    expect(decodeURIComponent(url!)).toContain("destination=41.311081,69.240562");
  });

  it("falls back to name + address when coords are missing/invalid", () => {
    const url = buildDirectionsUrl({ coords: "not-coords", name: "Med Center", address: "Amir Temur 12" });
    expect(decodeURIComponent(url!)).toContain("destination=Med Center, Amir Temur 12");
  });

  it("falls back to name + address when coords are missing/invalid", () => {
    const url = buildDirectionsUrl({ coords: "not-coords", name: "Med Center", address: "Amir Temur 12" });
    expect(url).toContain("destination=Med+Center%2C+Amir+Temur+12");
  });

  it("falls back to address alone when only address is present", () => {
    const url = buildDirectionsUrl({ address: "Chilonzor 5" });
    expect(url).toContain("destination=Chilonzor+5");
  });


  it("includes the origin when supplied", () => {
    const url = buildDirectionsUrl({ coords: "41.3,69.2", origin: "41.0,69.0" });
    expect(decodeURIComponent(url!)).toContain("origin=41.0,69.0");
  });

  it("returns null when there is nothing to navigate to", () => {
    expect(buildDirectionsUrl({})).toBeNull();
    expect(buildDirectionsUrl({ coords: null, name: null, address: null })).toBeNull();
  });
});
