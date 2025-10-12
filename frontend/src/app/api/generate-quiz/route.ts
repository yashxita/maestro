import { type NextRequest, NextResponse } from "next/server"
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
export async function POST(request: NextRequest) {
  try {
    const { text, count } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    const response = await fetch(`${baseUrl}/generate-quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, count }),
    })

    if (!response.ok) throw new Error(`Backend error: ${response.status}`)

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Quiz generation error:", error)
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 })
  }
}
