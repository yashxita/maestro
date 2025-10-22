import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/files`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json()
        return NextResponse.json({ error: error.detail || "Failed to get files" }, { status: response.status })
      } else {
        const errorText = await response.text()
        console.error("Non-JSON error response:", errorText)
        return NextResponse.json({ error: "Failed to get files" }, { status: response.status })
      }
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in /api/files:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
