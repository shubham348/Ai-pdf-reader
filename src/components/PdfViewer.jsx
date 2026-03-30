import { useEffect, useRef } from 'react'
import CollapsiblePanel from './CollapsiblePanel'

function PdfPageCanvas({ pageNumber, pdfDocument, onRenderError }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!pdfDocument || !canvasRef.current) {
      return undefined
    }

    let cancelled = false
    let renderTask = null

    const renderPage = async () => {
      const canvas = canvasRef.current
      if (!canvas) {
        return
      }

      const page = await pdfDocument.getPage(pageNumber)
      if (cancelled) {
        return
      }

      const baseViewport = page.getViewport({ scale: 1 })
      const parentWidth = canvas.parentElement?.clientWidth ?? baseViewport.width
      const scale = Math.max(0.75, (parentWidth - 24) / baseViewport.width)
      const viewport = page.getViewport({ scale })
      const outputScale = window.devicePixelRatio || 1
      const context = canvas.getContext('2d')

      if (!context) {
        return
      }

      canvas.width = Math.floor(viewport.width * outputScale)
      canvas.height = Math.floor(viewport.height * outputScale)
      canvas.style.width = '100%'
      canvas.style.height = 'auto'
      context.setTransform(1, 0, 0, 1, 0, 0)
      context.clearRect(0, 0, canvas.width, canvas.height)

      renderTask = page.render({
        canvasContext: context,
        viewport,
        transform: outputScale === 1 ? null : [outputScale, 0, 0, outputScale, 0, 0],
      })

      await renderTask.promise
    }

    renderPage().catch((err) => {
      if (err?.name === 'RenderingCancelledException') {
        return
      }

      console.error(err)
      onRenderError('Unable to render the PDF preview.')
    })

    return () => {
      cancelled = true
      renderTask?.cancel()
    }
  }, [onRenderError, pageNumber, pdfDocument])

  return (
    <canvas
      ref={canvasRef}
      aria-label={`PDF page ${pageNumber}`}
      className="pdf-page-canvas"
    />
  )
}

function PdfViewer({
  error,
  loading,
  onOpenChange,
  pageCount,
  pdfDocument,
  onRenderError,
  uploadControl,
}) {
  return (
    <CollapsiblePanel
      title="Document Viewer"
      actions={uploadControl}
      className="viewer-shell"
      bodyClassName="viewer-content"
      defaultMobileOpen={false}
      onOpenChange={onOpenChange}
    >
      {pageCount > 0 ? (
        <div className="pdf-page-stack">
          {Array.from({ length: pageCount }, (_, index) => (
            <div className="pdf-page-frame" key={index}>
              <PdfPageCanvas
                pageNumber={index + 1}
                pdfDocument={pdfDocument}
                onRenderError={onRenderError}
              />
            </div>
          ))}
        </div>
      ) : loading ? (
        <p className="viewer-copy">Rendering PDF pages, please wait...</p>
      ) : (
        <p className="viewer-placeholder">Upload a PDF to begin reading</p>
      )}
      {error ? <p className="viewer-error">{error}</p> : null}
    </CollapsiblePanel>
  )
}

export default PdfViewer
