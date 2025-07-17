"use client"

import { useState } from "react"
import { VideoInputForm } from "@/components/video-input-form"
import { SummaryDisplay } from "@/components/summary-display"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export default function HomePage() {
  const [summaryData, setSummaryData] = useState<{
    title: string | null
    transcript: string | null
    summary: string | null
  } | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-black text-white overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/25 via-transparent to-transparent animate-pulse-glow" />
      </div>

      <Card className="relative z-10 w-full max-w-3xl shadow-2xl bg-black text-white border-2 border-primary animate-fade-in-up rounded-xl">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-4xl font-extrabold text-primary tracking-tight">AI Video/Audio Analyzer</CardTitle>
          <CardDescription className="text-lg text-gray-400 mt-2">
            Unlock insights from your content. Upload a file or paste a YouTube link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <VideoInputForm setSummaryData={setSummaryData} setLoading={setLoading} setError={setError} />
          <SummaryDisplay summaryData={summaryData} loading={loading} error={error} />
        </CardContent>
      </Card>
    </main>
  )
}
