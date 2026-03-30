const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        Allow: 'POST',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answer: 'Method Not Allowed' }),
    }
  }

  const groqApiKey = process.env.GROQ_API_KEY

  if (!groqApiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer: 'Server is missing GROQ_API_KEY' }),
    }
  }

  try {
    const { context, question, mode } = JSON.parse(event.body || '{}')

    if (!context) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: 'Context is required' }),
      }
    }

    const messages =
      mode === 'summary'
        ? [
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
        : [
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

    const groqResponse = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqApiKey}`,
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

      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: 'Unable to generate a response right now' }),
      }
    }

    const data = await groqResponse.json()
    const answer = data.choices?.[0]?.message?.content?.trim() || ''

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer }),
    }
  } catch (error) {
    console.error('Request failed:', error)

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer: 'Unable to generate a response right now' }),
    }
  }
}
