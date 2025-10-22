import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id: chatId } = await params

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/chats/${chatId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      let errorMessage = "Failed to get chat"
      try {
        const error = await response.json()
        errorMessage = error.detail || errorMessage
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage
      }
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET /api/chats/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id: chatId } = await params

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/chats/${chatId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      let errorMessage = "Failed to delete chat"
      try {
        const error = await response.json()
        errorMessage = error.detail || errorMessage
      } catch {
        errorMessage = response.statusText || errorMessage
      }
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in DELETE /api/chats/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
