import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  // Clear the auth token cookie
  const res = NextResponse.json({ message: "Logged out successfully" })
  res.cookies.delete("auth_token")
  return res
}
