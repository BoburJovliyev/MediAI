import { toast } from "sonner";

/**
 * Build a Google Maps directions URL. Prefers precise coordinates; falls back
 * to a text query built from the place name + address.
 */
export function buildDirectionsUrl(opts: {
  coords?: string | null;
  name?: string | null;
  address?: string | null;
  origin?: string | null;
}): string | null {
  const { coords, name, address, origin } = opts;

  let destination: string | null = null;
  if (coords && /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(coords.trim())) {
    destination = coords.trim();
  } else if (name) {
    destination = `${name} ${address || ""}`.trim();
  }
  if (!destination) return null;

  const params = new URLSearchParams({
    api: "1",
    destination,
    travelmode: "driving",
  });
  if (origin) params.set("origin", origin);

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/**
 * Reliably open a URL in a brand-new browser tab. Using an ephemeral anchor
 * element (instead of a plain window.open) escapes sandboxed-iframe popup
 * blockers and avoids the ERR_BLOCKED_BY_RESPONSE / COOP issues that occur
 * when a maps link tries to render inside the preview frame.
 */
function openInNewTab(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Open turn-by-turn navigation to a destination. Tries to use the user's live
 * location as the route origin (so Google Maps shows the full driving route
 * like the reference screenshot); silently falls back to letting Google pick
 * "Your location" if geolocation is unavailable or denied.
 */
export function openNavigation(dest: {
  coords?: string | null;
  name?: string | null;
  address?: string | null;
}) {
  const launch = (origin?: string | null) => {
    const url = buildDirectionsUrl({ ...dest, origin });
    if (!url) {
      toast.error("Manzil ma'lumoti topilmadi");
      return;
    }
    openInNewTab(url);
  };

  if (typeof navigator !== "undefined" && navigator.geolocation) {
    let settled = false;
    const done = (origin?: string | null) => {
      if (settled) return;
      settled = true;
      launch(origin);
    };
    // Don't block the UX: fire after a short timeout even without a fix.
    const timer = setTimeout(() => done(null), 4000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        done(`${pos.coords.latitude},${pos.coords.longitude}`);
      },
      () => {
        clearTimeout(timer);
        done(null);
      },
      { enableHighAccuracy: true, timeout: 3500, maximumAge: 60000 }
    );
  } else {
    launch(null);
  }
}
