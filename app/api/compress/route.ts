import {
  isValidYouTubeUrl,
  downloadAudioFromYoutube,
  compressAudio,
} from "@/lib/audioUtils"
import { promises as fs } from "fs"
import path from "path"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    console.log("[compress] Request received")
    const { youtubeUrl, blobUrl } = await req.json()
    console.log("[compress] Parsed body:", { youtubeUrl, blobUrl })

    let originalPath: string
    let sourceType: "youtube" | "blob"

    // download from yt
    if (youtubeUrl) {
      console.log("[compress] Validating YouTube URL")
      if (!isValidYouTubeUrl(youtubeUrl)) {
        console.warn("[compress] Invalid YouTube URL:", youtubeUrl)
        return new Response(
          JSON.stringify({ error: "Invalid YouTube URL" }),
          { status: 400 }
        )
      }
      console.log("[compress] Downloading audio from YouTube:", youtubeUrl)
      originalPath = await downloadAudioFromYoutube(youtubeUrl)
      console.log("[compress] YouTube audio downloaded to:", originalPath)
      sourceType = "youtube"
    }

    else if (blobUrl) {
      console.log("[compress] Fetching blob from URL:", blobUrl)
      const res = await fetch(blobUrl)
      if (!res.ok) {
        console.error("[compress] Failed to fetch blob:", res.status)
        return new Response(
          JSON.stringify({ error: "Failed to fetch blob" }),
          { status: 400 }
        )
      }

      const blob = await res.blob()
      const buffer = Buffer.from(await blob.arrayBuffer())
      const tempPath = `/tmp/blob-audio-${Date.now()}.mp3`
      await fs.writeFile(tempPath, buffer)
      console.log("[compress] Blob saved to temp file:", tempPath)
      originalPath = tempPath
      sourceType = "blob"
    }

    else {
      console.warn("[compress] No YouTube URL or blob URL provided")
      return new Response(
        JSON.stringify({ error: "No YouTube URL or blob URL provided" }),
        { status: 400 }
      )
    }

    console.log("[compress] Compressing audio file:", originalPath)
    const { compressedPath, originalSize, compressedSize } = await compressAudio(originalPath)
    console.log(
      `[compress] Compression complete. Original size: ${originalSize} bytes, Compressed size: ${compressedSize} bytes, Compressed path: ${compressedPath}`
    )

    console.log("[compress] Reading compressed file for upload")
    const fileBuffer = await fs.readFile(compressedPath)
    const filename = path.basename(compressedPath)

    // reupload compressed audio file to vercel blob storage
    const formData = new FormData()
    const fileBlob = new Blob([fileBuffer], { type: "audio/mpeg" })
    formData.append("file", fileBlob, filename)

    console.log("[compress] Uploading compressed audio to /api/upload-blob")

    const uploadRes = await fetch(`${process.env.BASE_URL}/api/upload-blob`, {
      method: "POST",
      headers: {
        "x-file-name": filename,
        "content-type": "audio/mpeg",
      },
      body: fileBuffer instanceof Buffer
        ? new ReadableStream({
            start(controller) {
              controller.enqueue(new Uint8Array(fileBuffer))
              controller.close()
            },
          })
        : fileBuffer,
      // @ts-expect-error: duplex is not yet in RequestInit type
      duplex: "half",
    })

    if (!uploadRes.ok) {
      const text = await uploadRes.text()
      console.error(`[compress] Upload failed with status ${uploadRes.status}:`, text)
      throw new Error(`Upload failed: ${uploadRes.status} ${text}`)
    }

    const { url } = await uploadRes.json()
    console.log("[compress] Upload successful, blob URL:", url)

    console.log("[compress] Cleaning up temp files")
    await fs.unlink(originalPath)
    await fs.unlink(compressedPath)

    return new Response(
      JSON.stringify({
        url,
        sizes: { original: originalSize, compressed: compressedSize },
        from: sourceType,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error: any) {
    console.error("[compress] Error occurred:", error)
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
