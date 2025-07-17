import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: Request): Promise<NextResponse> {
  const filename = request.headers.get("x-file-name")
  const contentType = request.headers.get("content-type")

  if (!filename || !contentType) {
    return NextResponse.json(
      { error: "Missing x-file-name or content-type header" },
      { status: 400 }
    )
  }

  try {
    const arrayBuffer = await request.arrayBuffer()

    const blob = await put(filename, arrayBuffer, {
      access: "public",
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN!,
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("Error uploading to Vercel Blob:", error)
    return NextResponse.json(
      { error: (error as Error).message || "Internal Server Error" },
      { status: 500 }
    )
  }
}
