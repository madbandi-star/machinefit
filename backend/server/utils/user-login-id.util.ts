/** Email local-part used as login id in member search / push sender labels. */
export function userLoginIdFromEmail(email: string): string {
  const at = email.indexOf('@');
  return at > 0 ? email.slice(0, at) : email;
}
