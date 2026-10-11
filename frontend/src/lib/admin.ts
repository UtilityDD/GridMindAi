export const ADMIN_EMAILS = ["dipnkr.das@gmail.com"];

export function isUserAdmin(email?: string | null, tierId?: string | null): boolean {
  if (!email && !tierId) return false;
  if (email && ADMIN_EMAILS.includes(email.toLowerCase().trim())) return true;
  if (tierId === "admin") return true;
  return false;
}
