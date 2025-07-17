"use client"

import { useState, type ChangeEvent, type FormEvent, type DragEvent } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, Youtube, UploadCloud, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface VideoInputFormProps {
  setSummaryData: (data: { title: string | null; transcript: string | null; summary: string | null } | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export function VideoInputForm({ setSummaryData, setLoading, setError }: VideoInputFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [youtubeUrl, setYoutubeUrl] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isDragOver, setIsDragOver] = useState<boolean>(false)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0])
      setYoutubeUrl("")
    } else {
      setFile(null)
    }
  }

  const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    setYoutubeUrl(event.target.value)
    setFile(null)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      setFile(event.dataTransfer.files[0])
      setYoutubeUrl("")
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSummaryData(null)
    setError(null)
    setLoading(true)
    setIsSubmitting(true)

    try {
      let blobUrl: string | null = null

      if (file) {
        // upload file to blob storage (vercel)
        const uploadResponse = await fetch("/api/upload-blob", {
          method: "POST",
          headers: {
            "Content-Type": file.type,
            "x-file-name": file.name,
          },
          body: file,
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json()
          throw new Error(errorData.error || "Failed to upload file to Vercel Blob.")
        }

        const uploadResult = await uploadResponse.json()
        blobUrl = uploadResult.url
        console.log("File uploaded to Vercel Blob:", blobUrl)
      } else if (youtubeUrl) {
        // compress and reupload to blob storage (vercel)
        const compressResponse = await fetch("/api/compress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ youtubeUrl }),
        })

        if (!compressResponse.ok) {
          const errorData = await compressResponse.json()
          throw new Error(errorData.error || "Failed to compress YouTube audio.")
        }

        const compressResult = await compressResponse.json()
        blobUrl = compressResult.url
        console.log("YouTube audio compressed and uploaded to blob:", blobUrl)
      } else {
        setError("Please upload a file or enter a YouTube URL.")
        setLoading(false)
        setIsSubmitting(false)
        return
      }

      // transcribe and summarize
      const analyzeResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ blobUrl }),
      })

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json()
        throw new Error(errorData.error || "Failed to get summary.")
      }

      const data = await analyzeResponse.json()
      setSummaryData(data)
    } catch (err: any) {
      console.error("Error during analysis:", err)
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="video-file" className="text-foreground text-lg font-semibold">
          Upload Video/Audio File
        </Label>
        <div
          className={cn(
            "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200",
            "bg-gray-900 hover:bg-gray-800",
            isDragOver ? "border-primary bg-gray-800" : "border-primary/50",
            isSubmitting || !!youtubeUrl ? "opacity-50 cursor-not-allowed" : "",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            id="video-file"
            type="file"
            accept="video/*,audio/*"
            onChange={handleFileChange}
            disabled={isSubmitting || !!youtubeUrl}
            className="hidden"
          />
          <label
            htmlFor="video-file"
            className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
          >
            {file ? (
              <div className="flex flex-col items-center text-center text-primary">
                <FileText className="h-10 w-10 mb-2" />
                <p className="text-lg font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                <UploadCloud className="h-12 w-12 mb-3 text-primary" />
                <p className="mb-2 text-lg">
                  <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                </p>
                <p className="text-sm">MP4, MP3, WAV, etc. (Max 25MB for demo)</p>
              </div>
            )}
          </label>
        </div>
      </div>

      <div className="relative flex items-center">
        <div className="flex-grow border-t border-gray-700" />
        <span className="flex-shrink mx-4 text-muted-foreground text-sm font-medium">OR</span>
        <div className="flex-grow border-t border-gray-700" />
      </div>

      <div className="space-y-3">
        <Label htmlFor="youtube-url" className="text-foreground text-lg font-semibold">
          YouTube URL
        </Label>
        <div className="relative">
          <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={22} />
          <Input
            id="youtube-url"
            type="url"
            placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            value={youtubeUrl}
            onChange={handleUrlChange}
            disabled={isSubmitting || !!file}
            className="pl-11 pr-4 py-2 bg-gray-900 text-foreground border border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full py-3 text-lg font-bold bg-primary text-black hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-primary/30"
        disabled={isSubmitting || (!file && !youtubeUrl)}
      >
        {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        {isSubmitting ? "Analyzing Content..." : "Get Summary & Transcript"}
      </Button>
    </form>
  )
}
