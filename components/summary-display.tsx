import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, CheckCircle, FileText, BookOpen, Loader2 } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface SummaryDisplayProps {
  summaryData: {
    title: string | null
    transcript: string | null
    summary: string | null
  } | null
  loading: boolean
  error: string | null
}

export function SummaryDisplay({ summaryData, loading, error }: SummaryDisplayProps) {
  if (loading) {
    return (
      <Card className="bg-card text-card-foreground border border-primary/50 animate-fade-in-up">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" /> Analyzing Content...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-[70%] bg-gray-700" />
            <Skeleton className="h-4 w-[50%] bg-gray-700" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-primary">Transcript:</h3>
            <Skeleton className="h-4 w-full bg-gray-700" />
            <Skeleton className="h-4 w-[95%] bg-gray-700" />
            <Skeleton className="h-4 w-[90%] bg-gray-700" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-primary">Summary:</h3>
            <Skeleton className="h-4 w-full bg-gray-700" />
            <Skeleton className="h-4 w-[85%] bg-gray-700" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="border-red-500 bg-red-900 text-white animate-fade-in-up">
        <Terminal className="h-5 w-5 text-red-300" />
        <AlertTitle className="text-red-300 text-lg font-semibold">Analysis Failed</AlertTitle>
        <AlertDescription className="text-red-200 mt-1">{error}</AlertDescription>
      </Alert>
    )
  }

  if (summaryData && (summaryData.transcript || summaryData.summary)) {
    return (
      <Card className="bg-card text-card-foreground border border-primary/50 animate-fade-in-up">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <CheckCircle className="h-6 w-6" /> {summaryData.title || "Analysis Result"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Accordion type="multiple" className="w-full">
            {summaryData.summary && (
              <AccordionItem value="item-1" className="border-b border-gray-700">
                <AccordionTrigger className="text-lg font-semibold text-primary hover:no-underline data-[state=open]:text-primary/80">
                  <BookOpen className="mr-2 h-5 w-5" /> Concise Summary
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-2">
                  <div className="p-4 rounded-md bg-gray-950 text-foreground text-base border border-gray-800 shadow-inner">
                    <p className="whitespace-pre-wrap">{summaryData.summary}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
            {summaryData.transcript && (
              <AccordionItem value="item-2" className="border-b border-gray-700">
                <AccordionTrigger className="text-lg font-semibold text-primary hover:no-underline data-[state=open]:text-primary/80">
                  <FileText className="mr-2 h-5 w-5" /> Full Transcript
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-2">
                  <div className="max-h-80 overflow-y-auto p-4 rounded-md bg-gray-950 text-foreground text-base border border-gray-800 shadow-inner">
                    <p className="whitespace-pre-wrap">{summaryData.transcript}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </CardContent>
      </Card>
    )
  }

  return null // Or a placeholder message if no summary yet
}
