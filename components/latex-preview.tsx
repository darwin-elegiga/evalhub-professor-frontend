"use client"

import { useEffect, useRef } from "react"

interface LatexPreviewProps {
  latex: string
}

export function LatexPreview({ latex }: LatexPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !latex) return

    // Load MathJax if not already loaded
    if (typeof window !== "undefined" && !(window as any).MathJax) {
      const script = document.createElement("script")
      script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
      script.async = true
      document.head.appendChild(script)

      script.onload = () => {
        if ((window as any).MathJax) {
          ;(window as any).MathJax.typesetPromise([containerRef.current])
        }
      }
    } else if ((window as any).MathJax) {
      ;(window as any).MathJax.typesetPromise([containerRef.current])
    }
  }, [latex])

  return (
    <div ref={containerRef} className="text-center">
      {`$$${latex}$$`}
    </div>
  )
}
