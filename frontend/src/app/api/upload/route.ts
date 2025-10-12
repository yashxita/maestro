import { type NextRequest, NextResponse } from "next/server"
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 })
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    // Forward PDF to FastAPI backend
    const externalFormData = new FormData()
    externalFormData.append("file", file)

    const externalResponse = await fetch(`${baseUrl}/upload`, {
      method: "POST",
      body: externalFormData,
    })

    if (!externalResponse.ok) {
      const errorText = await externalResponse.text().catch(() => "Unknown error")
      console.error("External API error:", errorText)
      return NextResponse.json({ error: "Failed to process PDF. Please try again." }, { status: 500 })
    }

    const result = await externalResponse.json()

    let podcastScript = ""

    if (result.full_text) {
      try {
        // Generate podcast script
        const podcastResponse = await fetch(`${baseUrl}/podcast`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: result.full_text }),
        })

        if (podcastResponse.ok) {
          const podcastResult = await podcastResponse.json()
          podcastScript = podcastResult.podcast_script || ""
        }
      } catch (error) {
        console.error("Podcast generation error:", error)
      }
    }

    return NextResponse.json({
      success: true,
      full_text: result.full_text || "",
      podcast_script: podcastScript,
    })
  } catch (error) {
    console.error("Upload API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
