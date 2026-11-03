/** Restrict all administrative destinations by verb. No free-form URL proxy. */
export function adminAllowed(method: string, segments: string[]): boolean {
  const path = segments.join("/");
  const id = "[1-9][0-9]{0,15}";
  const code = "PB-[0-9A-F]{16}";
  const rules: Record<string, RegExp[]> = {
    GET: [
      /^(courts|venue|venue\/hours|pricing\/rules|payments\/pending|staff|bookings|operations\/blocks|operations\/availability)$/,
      new RegExp("^courts/" + id + "$"),
      new RegExp("^payments/bookings/" + code + "$"),
      new RegExp("^payments/" + id + "/proof$"),
    ],
    POST: [
      /^(courts|pricing\/rules|staff|operations\/manual-bookings|operations\/blocks|auth\/change-password)$/,
      new RegExp("^bookings/" + code + "/(confirm|cancel)$"),
      new RegExp("^payments/bookings/" + code + "$"),
      new RegExp("^payments/" + id + "/(approve|reject|record-refund)$"),
      new RegExp("^operations/blocks/" + id + "/remove$"),
      new RegExp("^staff/" + id + "/reset-password$"),
    ],
    PUT: [
      /^(venue|venue\/hours)$/,
      new RegExp("^courts/" + id + "$"),
      new RegExp("^pricing/rules/" + id + "$"),
    ],
    PATCH: [
      new RegExp("^pricing/rules/" + id + "/deactivate$"),
      new RegExp("^staff/" + id + "/active$"),
    ],
  };
  return Boolean(rules[method]?.some((rule) => rule.test(path)));
}
