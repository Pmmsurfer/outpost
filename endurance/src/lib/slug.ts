/**
 * Generate a URL-safe slug from a display name.
 * e.g. "Sofia Martinez" → "sofia-martinez"
 */
export function nameToSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "host";
}
