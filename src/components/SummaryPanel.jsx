import CollapsiblePanel from './CollapsiblePanel'

function parseSummary(summary) {
  const normalized = summary
    .replace(/\r/g, '')
    .replace(/\*\*Simple Explanation\*\*/gi, 'Simple Explanation')
    .replace(/\*\*Bullet Points\*\*/gi, 'Bullet Points')
    .replace(/\*\*Key Concepts\*\*/gi, 'Key Concepts')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()

  const explanationMatch = normalized.match(
    /Simple Explanation\s*:?\s*(.*?)(?=\s*Bullet Points\s*:|\s*Key Concepts\s*:|$)/i,
  )
  const bulletMatch = normalized.match(
    /Bullet Points\s*:?\s*(.*?)(?=\s*Key Concepts\s*:|$)/i,
  )
  const keyConceptsMatch = normalized.match(/Key Concepts\s*:?\s*(.*)$/i)

  const explanation = explanationMatch?.[1]
    ? explanationMatch[1]
        .split(/\s{2,}|(?<=\.)\s+(?=[A-Z])/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
    : []

  const splitList = (value) =>
    (value || '')
      .split(/\s*\*\s+|\s+(?=\*\s+)/)
      .map((item) => item.replace(/^\*\s*/, '').trim())
      .filter(Boolean)

  const bulletPoints = splitList(bulletMatch?.[1])
  const keyConcepts = splitList(keyConceptsMatch?.[1])

  return { bulletPoints, explanation, keyConcepts }
}

function SummaryPanel({ open, onOpenChange, summary, summaryLoading }) {
  const parsedSummary = summary ? parseSummary(summary) : null

  return (
    <CollapsiblePanel
      title="Summary"
      className="panel-section"
      bodyClassName="panel-body panel-body--scroll summary-content"
      defaultDesktopOpen={true}
      defaultMobileOpen={true}
      onOpenChange={onOpenChange}
      open={open}
      showToggleOnDesktop={true}
    >
      {summaryLoading ? (
        <p className="viewer-copy">Generating summary...</p>
      ) : summary ? (
        <div className="summary-text">
          {parsedSummary?.explanation.length ? (
            <div className="summary-block">
              {parsedSummary.explanation.map((paragraph, index) => (
                <p className="summary-paragraph" key={`explanation-${index}`}>
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}

          {parsedSummary?.bulletPoints.length ? (
            <div className="summary-block">
              <h3 className="summary-heading">Highlights</h3>
              <ul className="summary-list">
                {parsedSummary.bulletPoints.map((item, index) => (
                  <li key={`bullet-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {parsedSummary?.keyConcepts.length ? (
            <div className="summary-block">
              <h3 className="summary-heading">Key Concepts</h3>
              <ul className="summary-list">
                {parsedSummary.keyConcepts.map((item, index) => (
                  <li key={`concept-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="viewer-copy">Summary will appear here after upload.</p>
      )}
    </CollapsiblePanel>
  )
}

export default SummaryPanel
