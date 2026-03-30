import { useState } from 'react'
import CollapsiblePanel from './CollapsiblePanel'

function ChatPanel({ chatHistory, context, onChatHistoryChange, onOpenChange, open }) {
  const [question, setQuestion] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  const handleSend = async () => {
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion || !context) {
      return
    }

    const nextHistory = [
      ...chatHistory,
      { role: 'user', content: trimmedQuestion },
    ]

    onChatHistoryChange(nextHistory)
    setQuestion('')
    setChatLoading(true)

    try {
      const response = await fetch('http://localhost:5000/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context,
          question: trimmedQuestion,
          mode: 'question',
        }),
      })

      if (!response.ok) {
        throw new Error('Question request failed.')
      }

      const result = await response.json()
      onChatHistoryChange([
        ...nextHistory,
        { role: 'assistant', content: result.answer ?? '' },
      ])
    } catch (error) {
      console.error(error)
      onChatHistoryChange([
        ...nextHistory,
        { role: 'assistant', content: 'Unable to get an answer right now.' },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  const handleKeyDown = async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      await handleSend()
    }
  }

  return (
    <CollapsiblePanel
      title="Chat"
      className="panel-section"
      bodyClassName="panel-body chat-panel-body"
      defaultDesktopOpen={false}
      defaultMobileOpen={false}
      onOpenChange={onOpenChange}
      open={open}
      showToggleOnDesktop={true}
    >
      <div className="chat-history">
        {chatHistory.map((message, index) => (
          <p className="viewer-copy chat-message" key={`${message.role}-${index}`}>
            <strong className="chat-role">
              {message.role === 'user' ? 'You:' : 'AI:'}
            </strong>{' '}
            {message.content}
          </p>
        ))}
        {chatLoading ? <p className="viewer-copy">Thinking...</p> : null}
      </div>
      <div className="chat-input">
        <input
          type="text"
          placeholder="Ask a question"
          value={question}
          onChange={(event) => {
            setQuestion(event.target.value)
          }}
          onKeyDown={handleKeyDown}
        />
        <button type="button" onClick={handleSend}>
          Send
        </button>
      </div>
    </CollapsiblePanel>
  )
}

export default ChatPanel
