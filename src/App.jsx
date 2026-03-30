import { useEffect, useRef, useState } from 'react'
import './App.css'
import ChatPanel from './components/ChatPanel'
import PdfViewer from './components/PdfViewer'
import SummaryPanel from './components/SummaryPanel'
import { getAskUrl } from './lib/api'
import pdfjsLib from './lib/pdfjs'

function App() {
  const [pdfDocument, setPdfDocument] = useState(null)
  const [pageCount, setPageCount] = useState(0)
  const [extractedText, setExtractedText] = useState('')
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(true)
  const [isSummaryOpen, setIsSummaryOpen] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState([])
  const [error, setError] = useState('')
  const documentRef = useRef(null)

  useEffect(() => {
    return () => {
      if (documentRef.current) {
        documentRef.current.destroy().catch(() => { })
        documentRef.current = null
      }
    }
  }, [])

  const handleUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.')
      return
    }

    setError('')
    setLoading(true)
    setSummary('')
    setSummaryLoading(false)
    setExtractedText('')
    setChatHistory([])
    setIsSummaryOpen(true)
    setIsChatOpen(false)
    setPdfDocument(null)
    setPageCount(0)

    try {
      if (documentRef.current) {
        await documentRef.current.destroy()
        documentRef.current = null
      }

      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      documentRef.current = pdf
      setPdfDocument(pdf)
      setPageCount(pdf.numPages)

      setSummaryLoading(true)

      const pageTexts = []

      for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
        const page = await pdf.getPage(pageIndex)
        const content = await page.getTextContent()
        const text = content.items.map((item) => item.str).join(' ')
        pageTexts.push(text)

        await new Promise((resolve) => {
          window.setTimeout(resolve, 0)
        })
      }

      const extractedText = pageTexts.join('\n\n')
      setExtractedText(extractedText)
      const response = await fetch(getAskUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: extractedText,
          mode: 'summary',
        }),
      })

      if (!response.ok) {
        throw new Error('Summary request failed.')
      }

      const result = await response.json()
      setSummary(result.answer ?? '')
    } catch (err) {
      console.error(err)
      setError('Unable to load the PDF or generate the summary.')
    } finally {
      setLoading(false)
      setSummaryLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">PDF AI Study</div>
        <label className="pdf-upload">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleUpload}
          />
          + New
        </label>
      </header>
      <main className={`app-main ${isPdfViewerOpen ? 'layout-split' : 'layout-focus-right'}`}>
        <section className={`left-panel ${isPdfViewerOpen ? 'left-panel-open' : 'left-panel-collapsed'}`}>
          <PdfViewer
            error={error}
            loading={loading}
            onOpenChange={(nextOpen, isMobile) => {
              if (!isMobile) {
                setIsPdfViewerOpen(nextOpen)
              }
            }}
            pageCount={pageCount}
            pdfDocument={pdfDocument}
            onRenderError={setError}
          />
        </section>

        <aside className={`right-panel ${isPdfViewerOpen ? 'right-panel-open' : 'right-panel-expanded'}`}>
          <SummaryPanel
            open={isSummaryOpen}
            onOpenChange={(nextOpen) => {
              setIsSummaryOpen(nextOpen)
            }}
            summary={summary}
            summaryLoading={summaryLoading}
          />
          <ChatPanel
            chatHistory={chatHistory}
            context={extractedText}
            onChatHistoryChange={setChatHistory}
            onOpenChange={(nextOpen) => {
              setIsChatOpen(nextOpen)
            }}
            open={isChatOpen}
          />
        </aside>
      </main>
    </div>
  )
}

export default App
