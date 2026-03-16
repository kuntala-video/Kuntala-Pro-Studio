import { NextResponse } from "next/server";
import { validateAdminLogin } from "@/lib/admin-auth";

export async function POST(req: Request) {

  const { email, password } = await req.json();

  const isValid = await validateAdminLogin(email, password);

  if (!isValid) {
    // Avoid giving specific error messages for security reasons.
    return new NextResponse("Invalid credentials", { status: 401 });
  }

  const response = NextResponse.json({
    success: true,
    role: "admin"
  });
  
  // Set the secure, httpOnly cookie to manage the admin session
  response.cookies.set("admin-auth", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 // 1 day
  });

  return response;
}
