import { readdir, readFile, writeFile, rename, mkdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { parseFrontmatter, serializeFrontmatter } from './frontmatter.js'

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

/**
 * Move a plan from pending/ to active/, set status: active.
 */
export async function activate(filename) {
  const base = PLANS_DIR()
  const src = join(base, 'pending', filename)
  if (!existsSync(src)) {
    console.error(`Plan not found in pending/: ${filename}`)
    process.exit(1)
  }
  const content = await readFile(src, 'utf8')
  const { frontmatter, body } = parseFrontmatter(content)
  frontmatter.status = 'active'
  await mkdir(join(base, 'active'), { recursive: true })
  await writeFile(join(base, 'active', filename), serializeFrontmatter(frontmatter, body))
  await unlink(src)
  console.log(frontmatter.title ?? filename)
}

/**
 * Move a plan from active/ to pending/, set status: pending.
 */
export async function suspend(filename) {
  const base = PLANS_DIR()
  const src = join(base, 'active', filename)
  if (!existsSync(src)) {
    console.error(`Plan not found in active/: ${filename}`)
    process.exit(1)
  }
  const content = await readFile(src, 'utf8')
  const { frontmatter, body } = parseFrontmatter(content)
  frontmatter.status = 'pending'
  await mkdir(join(base, 'pending'), { recursive: true })
  await writeFile(join(base, 'pending', filename), serializeFrontmatter(frontmatter, body))
  await unlink(src)
  console.log(frontmatter.title ?? filename)
}

/**
 * Move a plan from active/ to done/, set status: done and shipped_at.
 */
export async function finish(filename) {
  const base = PLANS_DIR()
  const src = join(base, 'active', filename)
  if (!existsSync(src)) {
    console.error(`Plan not found in active/: ${filename}`)
    process.exit(1)
  }
  const content = await readFile(src, 'utf8')
  const { frontmatter, body } = parseFrontmatter(content)
  frontmatter.status = 'done'
  frontmatter.shipped_at = new Date().toISOString().slice(0, 10)
  await mkdir(join(base, 'done'), { recursive: true })
  await writeFile(join(base, 'done', filename), serializeFrontmatter(frontmatter, body))
  await unlink(src)
  console.log(frontmatter.title ?? filename)
}

/**
 * Move all done/ plans matching a phase to archived/<phase>/.
 */
export async function archive(phase) {
  const base = PLANS_DIR()
  const doneDir = join(base, 'done')
  if (!existsSync(doneDir)) {
    console.log('0 plans archived')
    return
  }
  const files = await readdir(doneDir)
  const archiveDir = join(base, 'archived', phase)
  let count = 0
  for (const file of files) {
    if (!file.endsWith('.md')) continue
    const content = await readFile(join(doneDir, file), 'utf8')
    const { frontmatter } = parseFrontmatter(content)
    if (frontmatter.phase === phase) {
      await mkdir(archiveDir, { recursive: true })
      await rename(join(doneDir, file), join(archiveDir, file))
      count++
    }
  }
  console.log(`${count} plans archived`)
}

/**
 * Update a frontmatter field on a plan file. Searches all directories.
 */
export async function set(filename, key, value) {
  const base = PLANS_DIR()
  const searchDirs = [
    join(base, 'active'),
    join(base, 'pending'),
    join(base, 'done'),
  ]
  // Also search archived subdirectories
  const archivedBase = join(base, 'archived')
  if (existsSync(archivedBase)) {
    const subDirs = readdirSync(archivedBase)
    for (const d of subDirs) {
      searchDirs.push(join(archivedBase, d))
    }
  }

  let fullPath = null
  for (const dir of searchDirs) {
    const candidate = join(dir, filename)
    if (existsSync(candidate)) {
      fullPath = candidate
      break
    }
  }

  if (!fullPath) {
    console.error(`Plan not found: ${filename}`)
    process.exit(1)
  }

  const content = await readFile(fullPath, 'utf8')
  const { frontmatter, body } = parseFrontmatter(content)

  // Parse value as number if numeric
  let parsed = value
  if (/^\d+$/.test(value)) {
    parsed = parseInt(value, 10)
  }

  frontmatter[key] = parsed
  await writeFile(fullPath, serializeFrontmatter(frontmatter, body))
  console.log(typeof parsed === 'string' ? parsed : JSON.stringify(parsed))
}
