function extractJsonPayload(text: string): string {
  const trimmed = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  const firstObject = trimmed.indexOf('{')
  const firstArray = trimmed.indexOf('[')

  if (firstObject === -1 && firstArray === -1) {
    return trimmed
  }

  const starts = [firstObject, firstArray].filter((index) => index >= 0)
  const start = Math.min(...starts)
  const openChar = trimmed[start]
  const closeChar = openChar === '[' ? ']' : '}'
  const end = trimmed.lastIndexOf(closeChar)

  if (end === -1 || end < start) {
    return trimmed.slice(start)
  }

  return trimmed.slice(start, end + 1)
}

function normalizeJsonText(text: string): string {
  return text
    .replace(/^\uFEFF/, '')
    .replace(/[\u200B-\u200D\u2060]/g, '')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u00A0/g, ' ')
}

function escapeControlCharsInsideStrings(text: string): string {
  let result = ''
  let inString = false
  let escaping = false

  for (const char of text) {
    if (escaping) {
      result += char
      escaping = false
      continue
    }

    if (char === '\\') {
      result += char
      escaping = true
      continue
    }

    if (char === '"') {
      result += char
      inString = !inString
      continue
    }

    if (inString) {
      if (char === '\n') {
        result += '\\n'
        continue
      }
      if (char === '\r') {
        result += '\\r'
        continue
      }
      if (char === '\t') {
        result += '\\t'
        continue
      }
    }

    result += char
  }

  return result
}

function removeTrailingCommas(text: string): string {
  let result = ''
  let inString = false
  let escaping = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]

    if (escaping) {
      result += char
      escaping = false
      continue
    }

    if (char === '\\') {
      result += char
      escaping = true
      continue
    }

    if (char === '"') {
      result += char
      inString = !inString
      continue
    }

    if (!inString && char === ',') {
      let lookahead = index + 1
      while (lookahead < text.length && /\s/.test(text[lookahead])) {
        lookahead += 1
      }

      const nextChar = text[lookahead]
      if (nextChar === '}' || nextChar === ']') {
        continue
      }
    }

    result += char
  }

  return result
}

export function parseJsonFromLlm<T>(text: string): { data: T; jsonText: string } | { error: string; jsonText: string } {
  const extracted = extractJsonPayload(text)
  const candidates = [
    extracted,
    normalizeJsonText(extracted),
    escapeControlCharsInsideStrings(extracted),
    removeTrailingCommas(normalizeJsonText(extracted)),
    escapeControlCharsInsideStrings(removeTrailingCommas(normalizeJsonText(extracted))),
  ]

  const seen = new Set<string>()
  let lastError = 'Unknown JSON parse error.'
  let lastCandidate = extracted

  for (const candidate of candidates) {
    if (!candidate || seen.has(candidate)) {
      continue
    }

    seen.add(candidate)
    lastCandidate = candidate

    try {
      return {
        data: JSON.parse(candidate) as T,
        jsonText: candidate,
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown JSON parse error.'
    }
  }

  return {
    error: lastError,
    jsonText: lastCandidate,
  }
}
