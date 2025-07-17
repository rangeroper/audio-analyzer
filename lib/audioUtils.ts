import { promises as fs, createReadStream } from "fs"
import path from "path"
import { join } from "path"
import { tmpdir } from "os"
import YTDlpWrap from "yt-dlp-wrap"
import OpenAI from "openai"
import { execFile } from "child_process"
import { promisify } from "util"
import { Buffer } from "buffer"

const execFileAsync = promisify(execFile)
const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export function isValidYouTubeUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    const hostname = parsedUrl.hostname
    const pathname = parsedUrl.pathname

    return (
      hostname === "youtu.be" ||
      hostname === "www.youtube.com" ||
      hostname === "youtube.com"
    ) && (
      pathname.startsWith("/watch") ||
      pathname.startsWith("/shorts/") ||
      parsedUrl.searchParams.has("v")
    )
  } catch {
    return false
  }
}

export function cleanYouTubeUrl(url: string): string {
  try {
    const u = new URL(url)

    // youtu.be short links
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/watch?v=${u.pathname.slice(1)}`
    }

    if (u.hostname === "www.youtube.com" || u.hostname === "youtube.com") {
      const v = u.searchParams.get("v")
      if (v) return `https://www.youtube.com/watch?v=${v}`

      // yt shorts
      if (u.pathname.startsWith("/shorts/")) {
        const id = u.pathname.split("/")[2] || u.pathname.split("/")[1]
        if (id) return `https://www.youtube.com/watch?v=${id}`
      }
    }

    return url
  } catch {
    return url
  }
}

export async function downloadAudioFromYoutube(youtubeUrl: string): Promise<string> {
  const ytDlpPath = process.env.YTDLP_PATH || "yt-dlp"
  const ytDlpWrap = new YTDlpWrap(ytDlpPath)
  const tempPath = join(tmpdir(), `yt-audio-${Date.now()}.mp3`)

  const cleanUrl = cleanYouTubeUrl(youtubeUrl)

  await ytDlpWrap.execPromise([
    cleanUrl,
    "-x",
    "--audio-format",
    "mp3",
    "-o",
    tempPath,
    "--user-agent",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    "--referer",
    "https://www.youtube.com/",
    "--no-check-certificate",
    "--ignore-errors",
    "--no-playlist",
    "--no-warnings",
    "--quiet"
  ])

  return tempPath
}

export async function compressAudio(inputPath: string): Promise<{ compressedPath: string; originalSize: number; compressedSize: number }> {
  const compressedPath = inputPath.replace(/\.mp3$/, "-compressed.mp3")

  await execFileAsync("ffmpeg", [
    "-i", inputPath,
    "-b:a", "64k",  // lower bitrate to compress
    compressedPath,
  ])

  const originalSize = (await fs.stat(inputPath)).size
  const compressedSize = (await fs.stat(compressedPath)).size

  return { compressedPath, originalSize, compressedSize }
}

export async function transcribeAudio(filePath: string): Promise<string> {
  const stream = createReadStream(filePath)

  const transcription = await openaiClient.audio.transcriptions.create({
    file: stream,
    model: "whisper-1",
  })

  return transcription.text
}

export async function transcribeAudioFile(audioFile: File): Promise<string> {
  const arrayBuffer = await audioFile.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const tempFilePath = path.join(tmpdir(), `audio-${Date.now()}.mp3`)
  await fs.writeFile(tempFilePath, buffer)

  // create readable stream from the temp file
  const fileStream = createReadStream(tempFilePath)

  try {
    const transcription = await openaiClient.audio.transcriptions.create({
      file: fileStream,
      model: "whisper-1",
      response_format: "verbose_json",
    })

    // format transcript into paragraphs
    const segments = (transcription as any).segments as { text: string; start: number; end: number }[]

    const paragraphs: string[] = []
    let currentParagraph: string[] = []
    let lastEnd = 0

    for (const segment of segments) {
      const gap = segment.start - lastEnd
      if (gap > 2 && currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join(" "))
        currentParagraph = []
      }
      currentParagraph.push(segment.text.trim())
      lastEnd = segment.end
    }

    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph.join(" "))
    }

    return paragraphs.join("\n\n")
  } finally {
    await fs.unlink(tempFilePath)
  }
}

export async function summarizeText(text: string): Promise<string> {
  const { choices } = await openaiClient.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: 
            `
                You are an expert summarizer. Format your summary in clean, readable markdown using paragraphs and bullet points.
                Avoid generic prefaces like "Sure, here's a summary." Don't repeat the podcast title or host name unless absolutely critical to context. 
                Focus only on core ideas, main arguments, and useful takeaways. Be clear and concise.  Use **paragraphs** for context and explanation. 
                Use **bullet points** to break down key points or sections clearly.
            `
      },
      {
        role: "user",
        content: `Summarize the following transcript:\n\n${text}`
      }
    ]
  })

  return choices[0].message.content ?? ""
}
