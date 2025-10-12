import { type NextRequest, NextResponse } from "next/server"
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function POST(request: NextRequest) {
  try {
    const { text, voice = "Puck", speed = 1.0 } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 })
    }

    // Determine the appropriate endpoint based on speed
    let endpoint = "normal"
    if (speed >= 1.25) {
      endpoint = "fast"
    } else if (speed <= 0.8) {
      endpoint = "slow"
    }

    const audioResponse = await fetch(`${baseUrl}/audio/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice, speed }),
    })

    if (!audioResponse.ok) {
      const errorText = await audioResponse.text().catch(() => "Unknown error")
      console.error("Audio generation error:", errorText)
      return NextResponse.json({ error: "Failed to generate audio. Please try again." }, { status: 500 })
    }

    // Stream the audio response
    const audioBuffer = await audioResponse.arrayBuffer()

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error("Audio generation API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
