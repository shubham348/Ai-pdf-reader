const cors = require('cors')
const dotenv = require('dotenv')
const express = require('express')
const path = require('path')

dotenv.config({ path: path.join(__dirname, '.env') })

const app = express()
const PORT = 5000
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'
const GROQ_API_KEY = process.env.GROQ_API_KEY

app.use(cors())
app.use(express.json())

app.post('/ask', async (req, res) => {
  const { context, question, mode } = req.body

  if (!GROQ_API_KEY) {
    return res.status(500).json({ answer: 'Server is missing GROQ_API_KEY' })
  }

  if (!context) {
    return res.status(400).json({ answer: 'Context is required' })
  }

  let messages
  if (mode === 'summary') {
    messages = [
      {
        role: 'system',
        content:
          'You summarize documents clearly for students. Return a simple explanation, then bullet points, then key concepts.',
      },
      {
        role: 'user',
        content: `Summarize the following document context.\n\nRequirements:\n- Start with a simple explanation.\n- Then provide bullet points.\n- Then provide key concepts.\n\nContext:\n${context}`,
      },
    ]
  } else {
    messages = [
      {
        role: 'system',
        content:
          'Answer questions using only the provided document context. If the answer is not found in the context, reply exactly: This is not covered in the document',
      },
      {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion:\n${question ?? ''}`,
      },
    ]
  }

  try {
    const groqResponse = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.2,
      }),
    })

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text()
      console.error('Groq API error:', errorText)
      return res.status(502).json({ answer: 'Unable to generate a response right now' })
    }

    const data = await groqResponse.json()
    const answer = data.choices?.[0]?.message?.content?.trim() || ''

    return res.json({ answer })
  } catch (error) {
    console.error('Request failed:', error)
    return res.status(500).json({ answer: 'Unable to generate a response right now' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
