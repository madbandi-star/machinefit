/** Display / push login label — prefer display name, never account email. */
export function userLoginIdFromEmail(
  _email: string | null | undefined,
  fallback?: string | null
): string {
  const name = fallback?.trim();
  if (name) return name;
  return 'user';
}

export function userLoginIdFromUser(user: {
  displayName?: string | null;
  id?: string;
}): string {
  const name = user.displayName?.trim();
  if (name) return name;
  if (user.id) return user.id.slice(0, 8);
  return 'user';
}
