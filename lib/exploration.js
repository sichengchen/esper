import { readdir, readFile, rename, mkdir } from 'fs/promises'
import { existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { parseFrontmatter } from './frontmatter.js'

const EXPLORATIONS_DIR = () => join(process.cwd(), '.esper', 'explorations')

/**
 * Read all exploration files from a directory, returning parsed frontmatter + filename.
 */
async function readExplorationsFromDir(dir) {
  if (!existsSync(dir)) return []
  const files = await readdir(dir)
  const explorations = []
  for (const file of files) {
    if (!file.endsWith('.md')) continue
    const content = await readFile(join(dir, file), 'utf8')
    const { frontmatter } = parseFrontmatter(content)
    explorations.push({ ...frontmatter, _file: file, _dir: dir })
  }
  return explorations
}

/**
 * List explorations (excluding archived/).
 */
export async function list(options = {}) {
  const { format = 'table' } = options
  const base = EXPLORATIONS_DIR()

  const explorations = await readExplorationsFromDir(base)

  // Sort by id
  explorations.sort((a, b) => {
    const ia = a.id ?? 999
    const ib = b.id ?? 999
    return ia - ib
  })

  if (format === 'json') {
    const output = explorations.map(({ _file, _dir, ...rest }) => rest)
    console.log(JSON.stringify(output, null, 2))
  } else {
    if (explorations.length === 0) {
      console.log('No explorations found.')
      return
    }
    for (const e of explorations) {
      const id = String(e.id ?? '?').padStart(3, '0')
      const title = (e.title ?? 'Untitled').padEnd(50)
      const mode = (e.mode ?? '').padEnd(10)
      const created = e.created ?? ''
      console.log(`  #${id}  ${title} ${mode} ${created}`)
    }
  }
}

/**
 * Find the next available exploration ID.
 */
export async function nextId() {
  const base = EXPLORATIONS_DIR()
  const dirs = [base]

  // Also scan archived subdirectory
  const archivedDir = join(base, 'archived')
  if (existsSync(archivedDir)) {
    dirs.push(archivedDir)
  }

  let maxId = 0
  for (const dir of dirs) {
    const explorations = await readExplorationsFromDir(dir)
    for (const e of explorations) {
      if (typeof e.id === 'number' && e.id > maxId) {
        maxId = e.id
      }
    }
  }

  console.log(String(maxId + 1).padStart(3, '0'))
}

/**
 * Get a single exploration's frontmatter as JSON.
 */
export async function get(filename) {
  const base = EXPLORATIONS_DIR()
  const fullPath = join(base, filename)

  if (!existsSync(fullPath)) {
    console.error(`Exploration not found: ${filename}`)
    process.exit(1)
  }

  const content = await readFile(fullPath, 'utf8')
  const { frontmatter } = parseFrontmatter(content)
  console.log(JSON.stringify(frontmatter, null, 2))
}

/**
 * Move an exploration to archived/.
 */
export async function archive(filename) {
  const base = EXPLORATIONS_DIR()
  const src = join(base, filename)

  if (!existsSync(src)) {
    console.error(`Exploration not found: ${filename}`)
    process.exit(1)
  }

  const archivedDir = join(base, 'archived')
  await mkdir(archivedDir, { recursive: true })
  await rename(src, join(archivedDir, filename))
  const content = await readFile(join(archivedDir, filename), 'utf8')
  const { frontmatter } = parseFrontmatter(content)
  console.log(frontmatter.title ?? filename)
}
