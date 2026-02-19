/**
 * Parse YAML frontmatter from a markdown file's content.
 * Expects --- delimiters at the start. Returns { frontmatter, body }.
 */
export function parseFrontmatter(content) {
  const lines = content.split('\n')
  if (lines[0].trim() !== '---') {
    return { frontmatter: {}, body: content }
  }

  let endIndex = -1
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      endIndex = i
      break
    }
  }

  if (endIndex === -1) {
    return { frontmatter: {}, body: content }
  }

  const frontmatter = {}
  for (let i = 1; i < endIndex; i++) {
    const line = lines[i]
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue

    const key = line.slice(0, colonIndex).trim()
    let value = line.slice(colonIndex + 1).trim()

    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    // Parse numeric values
    if (/^\d+$/.test(value)) {
      frontmatter[key] = parseInt(value, 10)
    } else {
      frontmatter[key] = value
    }
  }

  const body = lines.slice(endIndex + 1).join('\n')
  return { frontmatter, body }
}

/**
 * Serialize a frontmatter object back to YAML frontmatter string.
 * Returns the full file content with frontmatter + body.
 */
export function serializeFrontmatter(frontmatter, body) {
  const lines = ['---']
  for (const [key, value] of Object.entries(frontmatter)) {
    if (value === undefined || value === null) continue
    lines.push(`${key}: ${value}`)
  }
  lines.push('---')
  const header = lines.join('\n')
  // Ensure there's a newline between the closing --- and the body
  if (body && !body.startsWith('\n')) {
    return header + '\n' + body
  }
  return header + body
}
