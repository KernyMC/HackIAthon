'use client'

import { useMemo } from 'react'

interface MarkdownContentProps {
  content: string
  className?: string
}

export function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  const nodes = useMemo(() => parseMarkdown(content), [content])
  return (
    <div className={`markdown-body text-sm leading-relaxed ${className}`}>
      {nodes}
    </div>
  )
}

type Node =
  | { type: 'h3'; text: string }
  | { type: 'h4'; text: string }
  | { type: 'ul'; items: InlineNode[][] }
  | { type: 'p'; inlines: InlineNode[] }
  | { type: 'hr' }

type InlineNode =
  | { kind: 'bold'; text: string }
  | { kind: 'italic'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'text'; text: string }

function parseInline(line: string): InlineNode[] {
  const nodes: InlineNode[] = []
  let i = 0
  const len = line.length
  while (i < len) {
    if (line[i] === '*' && line[i + 1] === '*') {
      const end = line.indexOf('**', i + 2)
      if (end !== -1) {
        nodes.push({ kind: 'bold', text: line.slice(i + 2, end) })
        i = end + 2
        continue
      }
    }
    if (line[i] === '*') {
      const end = line.indexOf('*', i + 1)
      if (end !== -1) {
        nodes.push({ kind: 'italic', text: line.slice(i + 1, end) })
        i = end + 1
        continue
      }
    }
    if (line[i] === '`') {
      const end = line.indexOf('`', i + 1)
      if (end !== -1) {
        nodes.push({ kind: 'code', text: line.slice(i + 1, end) })
        i = end + 1
        continue
      }
    }
    let j = i + 1
    while (j < len && line[j] !== '*' && line[j] !== '`') j++
    nodes.push({ kind: 'text', text: line.slice(i, j) })
    i = j
  }
  return nodes
}

function renderInline(nodes: InlineNode[], key: string): React.ReactNode[] {
  return nodes.map((n, i) => {
    if (n.kind === 'bold') return <strong key={`${key}-${i}`} className="font-semibold text-white">{n.text}</strong>
    if (n.kind === 'italic') return <em key={`${key}-${i}`}>{n.text}</em>
    if (n.kind === 'code') return <code key={`${key}-${i}`} className="bg-[#242424] text-[#C8FF00] px-1 rounded text-[11px] font-mono">{n.text}</code>
    return <span key={`${key}-${i}`}>{n.text}</span>
  })
}

function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const result: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Skip empty lines
    if (!trimmed) { i++; continue }

    // HR
    if (/^---+$/.test(trimmed)) {
      result.push(<hr key={i} className="border-[#2A2A2A] my-2" />)
      i++; continue
    }

    // H3
    if (trimmed.startsWith('### ')) {
      result.push(
        <h3 key={i} className="text-base font-bold text-white mt-3 mb-1.5" style={{ fontFamily: 'var(--font-heading)' }}>
          {trimmed.slice(4)}
        </h3>
      )
      i++; continue
    }

    // H4 / H2
    if (trimmed.startsWith('## ')) {
      result.push(
        <h4 key={i} className="text-sm font-semibold text-white mt-2.5 mb-1">
          {trimmed.slice(3)}
        </h4>
      )
      i++; continue
    }

    // Bullet list - collect consecutive list items
    if (/^[-*•]\s+/.test(trimmed)) {
      const items: React.ReactNode[] = []
      while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^[-*•]\s+/, '')
        items.push(
          <li key={i} className="flex gap-2">
            <span className="text-[#C8FF00] mt-1.5 flex-shrink-0 text-[8px]">◆</span>
            <span>{renderInline(parseInline(itemText), `li-${i}`)}</span>
          </li>
        )
        i++
      }
      result.push(
        <ul key={`ul-${i}`} className="space-y-1 my-1.5 text-neutral-300">
          {items}
        </ul>
      )
      continue
    }

    // Numbered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: React.ReactNode[] = []
      let num = 1
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^\d+\.\s+/, '')
        items.push(
          <li key={i} className="flex gap-2">
            <span className="text-[#C8FF00] font-mono text-xs flex-shrink-0 w-4">{num}.</span>
            <span>{renderInline(parseInline(itemText), `ol-${i}`)}</span>
          </li>
        )
        i++; num++
      }
      result.push(
        <ol key={`ol-${i}`} className="space-y-1 my-1.5 text-neutral-300">
          {items}
        </ol>
      )
      continue
    }

    // Paragraph
    result.push(
      <p key={i} className="text-neutral-300 mb-1.5">
        {renderInline(parseInline(trimmed), `p-${i}`)}
      </p>
    )
    i++
  }

  return result
}
