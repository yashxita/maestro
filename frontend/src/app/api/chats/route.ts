import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    console.log("token:", token);
    console.log("check: ",process.env.NEXT_PUBLIC_API_BASE_URL);
    console.log(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/chats`)
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/chats`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      
    })
    console.log("response:", response);
    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.detail || "Failed to get chats" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in /api/chats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/chats`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.detail || "Failed to create chat" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in POST /api/chats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
