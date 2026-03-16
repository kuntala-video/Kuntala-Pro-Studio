import bcrypt from "bcryptjs"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_HASHED_PASSWORD = process.env.ADMIN_HASHED_PASSWORD;

export async function validateAdminLogin(
  email: string,
  password: string
) {
  if (!ADMIN_EMAIL || !ADMIN_HASHED_PASSWORD) {
    console.error("Admin credentials are not configured in environment variables.");
    return false;
  }
  
  if (email !== ADMIN_EMAIL) return false;

  const match = await bcrypt.compare(password, ADMIN_HASHED_PASSWORD);
  return match;
}
