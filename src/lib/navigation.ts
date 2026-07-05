import { toast } from "sonner";

/**
 * Build a Google Maps directions URL. Prefers precise coordinates; falls back
 * to a text query built from the place name + address; finally falls back to
 * the address or name alone. Returns null only when there is truly nothing to
 * navigate to.
 */
export function buildDirectionsUrl(opts: {
  coords?: string | null;
  name?: string | null;
  address?: string | null;
  origin?: string | null;
}): string | null {
  const { coords, name, address, origin } = opts;

  const destination = resolveDestination({ coords, name, address });
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
 * Resolve the best possible destination string from whatever data is available.
 * coords > "name address" > address > name.
 */
function resolveDestination(opts: {
  coords?: string | null;
  name?: string | null;
  address?: string | null;
}): string | null {
  const { coords, name, address } = opts;

  if (coords && /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(coords.trim())) {
    return coords.trim();
  }
  const parts = [name, address].filter(Boolean).map((s) => (s as string).trim());
  if (parts.length) return parts.join(", ");
  return null;
}

/**
 * Reliably open a URL in a brand-new browser tab. Using an ephemeral anchor
 * element (instead of a plain window.open) escapes sandboxed-iframe popup
 * blockers and avoids the ERR_BLOCKED_BY_RESPONSE / COOP issues that occur
 * when a maps link tries to render inside the preview frame.
 */
function openInNewTab(url: string): boolean {
  try {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch {
    try {
      window.open(url, "_blank", "noopener,noreferrer");
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Open turn-by-turn navigation to a destination. Tries to use the user's live
 * location as the route origin (so Google Maps shows the full driving route);
 * gracefully falls back to letting Google pick "Your location" if geolocation
 * is unavailable, denied, or times out. When the permission is explicitly
 * denied we surface a clear message telling the user we're still opening the
 * destination without their current location.
 */
export function openNavigation(dest: {
  coords?: string | null;
  name?: string | null;
  address?: string | null;
}) {
  // Guard: nothing to navigate to at all.
  if (!resolveDestination(dest)) {
    toast.error("Manzil ma'lumoti topilmadi", {
      description: "Ushbu qabul uchun shifoxona manzili belgilanmagan.",
    });
    return;
  }

  const launch = (origin?: string | null) => {
    const url = buildDirectionsUrl({ ...dest, origin });
    if (!url) {
      toast.error("Manzil ma'lumoti topilmadi");
      return;
    }
    const opened = openInNewTab(url);
    if (!opened) {
      toast.error("Xaritani ochib bo'lmadi", {
        description: "Brauzeringiz yangi oynani bloklagan bo'lishi mumkin.",
      });
    }
  };

  if (typeof navigator === "undefined" || !navigator.geolocation) {
    toast.info("Joylashuv aniqlanmadi", {
      description: "Manzilga yo'nalish ochilmoqda — boshlang'ich nuqtani xaritada tanlang.",
    });
    launch(null);
    return;
  }

  let settled = false;
  const done = (origin?: string | null) => {
    if (settled) return;
    settled = true;
    launch(origin);
  };

  // Don't block the UX: fire after a short timeout even without a fix.
  const timer = setTimeout(() => {
    toast.info("Joylashuv aniqlanmadi", {
      description: "Manzilga yo'nalish ochilmoqda — boshlang'ich nuqtani xaritada tanlang.",
    });
    done(null);
  }, 4000);

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      clearTimeout(timer);
      done(`${pos.coords.latitude},${pos.coords.longitude}`);
    },
    (err) => {
      clearTimeout(timer);
      if (err.code === err.PERMISSION_DENIED) {
        toast.info("Joylashuvga ruxsat berilmadi", {
          description: "Manzilga yo'nalish ochilmoqda — Google Maps boshlang'ich nuqtangizni so'raydi.",
        });
      } else {
        toast.info("Joylashuvni aniqlab bo'lmadi", {
          description: "Manzilga yo'nalish ochilmoqda — boshlang'ich nuqtani tanlang.",
        });
      }
      done(null);
    },
    { enableHighAccuracy: true, timeout: 3500, maximumAge: 60000 }
  );
}
