"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface ExportButtonProps {
  elementId: string
  filename: string
}

export function ExportButton({ elementId, filename }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const exportAsPng = async () => {
    try {
      setIsExporting(true)

      // Dynamically import html2canvas
      const html2canvas = (await import("html2canvas")).default

      const element = document.getElementById(elementId)
      if (!element) {
        throw new Error(`Element with ID "${elementId}" not found`)
      }

      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: 2, // Higher quality
        logging: false,
        allowTaint: true,
        useCORS: true,
      })

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            throw new Error("Failed to create blob from canvas")
          }
        }, "image/png")
      })

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${filename}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting as PNG:", error)
      alert("Erro ao exportar a imagem. Por favor, tente novamente.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button onClick={exportAsPng} disabled={isExporting} className="bg-white/10 hover:bg-white/20 backdrop-blur-md">
      <Download className="mr-2 h-4 w-4" />
      {isExporting ? "Exportando..." : "Exportar como PNG"}
    </Button>
  )
}
