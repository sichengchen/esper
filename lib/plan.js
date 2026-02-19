import { readdir, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { parseFrontmatter } from './frontmatter.js'

const PLANS_DIR = () => join(process.cwd(), '.esper', 'plans')

/**
 * Read all plan files from a specific directory, returning parsed frontmatter + filename.
 */
async function readPlansFromDir(dir) {
  if (!existsSync(dir)) return []
  const files = await readdir(dir)
  const plans = []
  for (const file of files) {
    if (!file.endsWith('.md')) continue
    const content = await readFile(join(dir, file), 'utf8')
    const { frontmatter } = parseFrontmatter(content)
    plans.push({ ...frontmatter, _file: file, _dir: dir })
  }
  return plans
}

import { readdirSync } from 'fs'

/**
 * List plans with filtering and sorting.
 */
export async function list(options = {}) {
  const { dir, phase, type, format = 'table' } = options
  const base = PLANS_DIR()

  let dirs
  if (dir === 'archived') {
    const archivedBase = join(base, 'archived')
    if (!existsSync(archivedBase)) {
      dirs = []
    } else {
      const subDirs = readdirSync(archivedBase)
      dirs = subDirs.map(d => join(archivedBase, d))
    }
  } else if (dir) {
    dirs = [join(base, dir)]
  } else {
    dirs = [join(base, 'active'), join(base, 'pending'), join(base, 'done')]
  }

  let plans = []
  for (const d of dirs) {
    plans.push(...await readPlansFromDir(d))
  }

  // Filter
  if (phase) plans = plans.filter(p => p.phase === phase)
  if (type) plans = plans.filter(p => p.type === type)

  // Sort
  plans.sort((a, b) => {
    const pa = a.priority ?? 9
    const pb = b.priority ?? 9
    if (pa !== pb) return pa - pb
    const ia = a.id ?? 999
    const ib = b.id ?? 999
    return ia - ib
  })

  if (format === 'json') {
    // Strip internal fields
    const output = plans.map(({ _file, _dir, ...rest }) => rest)
    console.log(JSON.stringify(output, null, 2))
  } else {
    if (plans.length === 0) {
      console.log('No plans found.')
      return
    }
    for (const p of plans) {
      const id = String(p.id ?? '?').padStart(3, '0')
      const title = (p.title ?? 'Untitled').padEnd(50)
      const status = (p.status ?? '').padEnd(8)
      const pType = (p.type ?? '').padEnd(8)
      const priority = p.priority != null ? `p${p.priority}` : ''
      const pPhase = p.phase ?? ''
      console.log(`  #${id}  ${title} ${status} ${pType} ${priority.padEnd(3)} [${pPhase}]`)
    }
  }
}

/**
 * Get a single plan's frontmatter as JSON.
 * If filepath is just a filename, search across directories.
 */
export async function get(filepath) {
  const base = PLANS_DIR()

  // Search order: active > pending > done
  const searchDirs = [
    join(base, 'active'),
    join(base, 'pending'),
    join(base, 'done'),
  ]

  let fullPath = null
  for (const dir of searchDirs) {
    const candidate = join(dir, filepath)
    if (existsSync(candidate)) {
      fullPath = candidate
      break
    }
  }

  if (!fullPath) {
    console.error(`Plan not found: ${filepath}`)
    process.exit(1)
  }

  const content = await readFile(fullPath, 'utf8')
  const { frontmatter } = parseFrontmatter(content)
  console.log(JSON.stringify(frontmatter, null, 2))
}

/**
 * Find the next available plan ID across all directories.
 */
export async function nextId() {
  const base = PLANS_DIR()
  const dirs = [
    join(base, 'pending'),
    join(base, 'active'),
    join(base, 'done'),
  ]

  // Also scan archived subdirectories
  const archivedBase = join(base, 'archived')
  if (existsSync(archivedBase)) {
    const subDirs = readdirSync(archivedBase)
    for (const d of subDirs) {
      dirs.push(join(archivedBase, d))
    }
  }

  let maxId = 0
  for (const dir of dirs) {
    const plans = await readPlansFromDir(dir)
    for (const p of plans) {
      if (typeof p.id === 'number' && p.id > maxId) {
        maxId = p.id
      }
    }
  }

  console.log(String(maxId + 1).padStart(3, '0'))
}
