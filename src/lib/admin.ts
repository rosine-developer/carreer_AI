// Admin configuration
// Add admin email addresses here � they get full Pro access automatically

const ADMIN_EMAILS = [
  'rosineumure6@gmail.com', // owner
];

/**
 * Check if a user email is an admin
 */
export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}




