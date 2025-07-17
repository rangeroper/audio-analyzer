import {
  transcribeAudioFile,
  summarizeText,
} from "@/lib/audioUtils"

import { File } from "fetch-blob/file"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    console.log("[analyze] Request received")
    const { blobUrl } = await req.json()
    console.log("[analyze] Parsed request body:", { blobUrl })

    if (!blobUrl) {
      console.warn("[analyze] Missing blobUrl in request")
      return new Response(
        JSON.stringify({ error: "Missing blobUrl" }),
        { status: 400 }
      )
    }

    console.log("[analyze] Fetching blob from URL:", blobUrl)
    const res = await fetch(blobUrl)
    if (!res.ok) {
      console.error("[analyze] Failed to fetch blob from storage:", res.status, res.statusText)
      return new Response(
        JSON.stringify({ error: "Failed to fetch blob from storage" }),
        { status: 400 }
      )
    }

    const blob = await res.blob()
    console.log("[analyze] Blob fetched, size:", blob.size, "type:", blob.type)

    const audioFile = new File([blob], "audio.mp3", { type: blob.type })
    console.log("[analyze] Created File object from blob:", audioFile.name, audioFile.size, audioFile.type)

    console.log("[analyze] Starting transcription...")
    const transcript = await transcribeAudioFile(audioFile)
    console.log("[analyze] Transcription complete. Transcript length:", transcript.length)

    console.log("[analyze] Starting summarization...")
    const summary = await summarizeText(transcript)
    console.log("[analyze] Summarization complete. Summary length:", summary.length)

    return new Response(
      JSON.stringify({
        title: "Uploaded Compressed Audio Analysis",
        transcript,
        summary,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error: any) {
    console.error("[analyze] Error occurred:", error)
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
