"use client"

import { renderCanvasToVideo } from "@/lib/video-renderer"
import { useState, type RefObject } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Loader2, Download } from "lucide-react"

export default function ExportPanel({ canvasRef }: { canvasRef: RefObject<HTMLCanvasElement> }) {

  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    if (!canvasRef.current) {
      toast({
        title: "Export Error",
        description: "Canvas element not found. The scene might be empty.",
        variant: "destructive"
      })
      return
    }
    
    setLoading(true)
    toast({
      title: "Rendering Video...",
      description: "Your animation is being exported. This may take a few moments."
    })

    try {
      const videoBlob = await renderCanvasToVideo(
        canvasRef.current,
        5, // duration in seconds
        30, // fps
        "1080p",
        "/logo.png" // Watermark image path
      )

      const url = URL.createObjectURL(videoBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = "kuntala-animation.mp4"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Export Complete!",
        description: "Your video has been downloaded."
      })

    } catch (error: any) {
      console.error("Video rendering failed:", error)
      toast({
        title: "Export Failed",
        description: error.message || "An unexpected error occurred while rendering the video.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={loading}
      size="sm"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Rendering...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Export Video
        </>
      )}
    </Button>
  )
}
