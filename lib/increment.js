import { readdir, readFile, writeFile, rename, mkdir, unlink } from 'fs/promises'
import { existsSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { parseFrontmatter, serializeFrontmatter } from './frontmatter.js'

const INCREMENTS_DIR = () => join(process.cwd(), '.esper', 'increments')
const CONTEXT_JSON = () => join(process.cwd(), '.esper', 'context.json')

/**
 * Read all increment files from a directory, returning parsed frontmatter + filename.
 */
async function readIncrementsFromDir(dir) {
  if (!existsSync(dir)) return []
  const files = await readdir(dir)
  const increments = []
  for (const file of files) {
    if (!file.endsWith('.md')) continue
    const content = await readFile(join(dir, file), 'utf8')
    const { frontmatter } = parseFrontmatter(content)
    increments.push({ ...frontmatter, _file: file, _dir: dir })
  }
  return increments
}

/**
 * Update context.json active_increment field.
 */
async function updateContext(activeFile, scope) {
  const path = CONTEXT_JSON()
  if (!existsSync(path)) return
  const raw = await readFile(path, 'utf8')
  const ctx = JSON.parse(raw)
  ctx.active_increment = activeFile
  ctx.active_increment_scope = scope ?? []
  await writeFile(path, JSON.stringify(ctx, null, 2) + '\n')
}

async function movePendingToActive(base, filename) {
  const src = join(base, 'pending', filename)
  if (!existsSync(src)) {
    console.error(`Increment not found in pending/: ${filename}`)
    process.exit(1)
  }

  const content = await readFile(src, 'utf8')
  const { frontmatter, body } = parseFrontmatter(content)
  frontmatter.status = 'active'
  await mkdir(join(base, 'active'), { recursive: true })
  await writeFile(join(base, 'active', filename), serializeFrontmatter(frontmatter, body))
  await unlink(src)
  return { frontmatter, body }
}

async function findNextPendingChild(base, parentId) {
  const pending = await readIncrementsFromDir(join(base, 'pending'))
  const children = pending
    .filter(increment => increment.parent === parentId)
    .sort((a, b) => {
      const priorityA = a.priority ?? 9
      const priorityB = b.priority ?? 9
      if (priorityA !== priorityB) return priorityA - priorityB
      const idA = a.id ?? Number.MAX_SAFE_INTEGER
      const idB = b.id ?? Number.MAX_SAFE_INTEGER
      return idA - idB
    })

  return children[0] ?? null
}

/**
 * List increments with filtering and sorting.
 */
export async function list(options = {}) {
  const { dir, lane, status, format = 'table' } = options
  const base = INCREMENTS_DIR()

  let dirs
  if (dir) {
    dirs = [join(base, dir)]
  } else {
    dirs = [join(base, 'active'), join(base, 'pending'), join(base, 'done')]
  }

  let increments = []
  for (const d of dirs) {
    increments.push(...await readIncrementsFromDir(d))
  }

  if (lane) increments = increments.filter(i => i.lane === lane)
  if (status) increments = increments.filter(i => i.status === status)

  // Sort by priority asc, then id asc
  increments.sort((a, b) => {
    const pa = a.priority ?? 9
    const pb = b.priority ?? 9
    if (pa !== pb) return pa - pb
    const ia = a.id ?? 999
    const ib = b.id ?? 999
    return ia - ib
  })

  if (format === 'json') {
    const output = increments.map(({ _file, _dir, ...rest }) => rest)
    console.log(JSON.stringify(output, null, 2))
  } else {
    if (increments.length === 0) {
      console.log('No increments found.')
      return
    }
    for (const i of increments) {
      const id = String(i.id ?? '?').padStart(3, '0')
      const title = (i.title ?? 'Untitled').padEnd(50)
      const iStatus = (i.status ?? '').padEnd(8)
      const iLane = (i.lane ?? '').padEnd(12)
      const priority = i.priority != null ? `p${i.priority}` : ''
      console.log(`  #${id}  ${title} ${iStatus} ${iLane} ${priority}`)
    }
  }
}

/**
 * Get a single increment's frontmatter as JSON.
 */
export async function get(filepath) {
  const base = INCREMENTS_DIR()
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
    console.error(`Increment not found: ${filepath}`)
    process.exit(1)
  }

  const content = await readFile(fullPath, 'utf8')
  const { frontmatter } = parseFrontmatter(content)
  console.log(JSON.stringify(frontmatter, null, 2))
}

/**
 * Find the next available increment ID across all directories.
 */
export async function nextId() {
  const base = INCREMENTS_DIR()
  const dirs = [
    join(base, 'pending'),
    join(base, 'active'),
    join(base, 'done'),
  ]

  const archivedDir = join(base, 'archived')
  if (existsSync(archivedDir)) {
    dirs.push(archivedDir)
  }

  let maxId = 0
  for (const dir of dirs) {
    const increments = await readIncrementsFromDir(dir)
    for (const i of increments) {
      if (typeof i.id === 'number' && i.id > maxId) {
        maxId = i.id
      }
    }
  }

  console.log(String(maxId + 1).padStart(3, '0'))
}

/**
 * Create a new increment file in pending/.
 */
export async function create(options = {}) {
  const { title, lane = 'atomic', type = 'feature', spec, spec_section, parent, priority = 1 } = options
  if (!title) {
    console.error('Usage: esperkit increment create --title <title> [--lane atomic|systematic] [--type feature|fix|chore] [--spec <file>] [--spec_section <section>] [--parent <id>] [--priority <n>]')
    process.exit(1)
  }

  const base = INCREMENTS_DIR()
  await mkdir(join(base, 'pending'), { recursive: true })

  // Compute next ID
  const dirs = [join(base, 'pending'), join(base, 'active'), join(base, 'done')]
  const archivedDir = join(base, 'archived')
  if (existsSync(archivedDir)) dirs.push(archivedDir)

  let maxId = 0
  for (const dir of dirs) {
    const increments = await readIncrementsFromDir(dir)
    for (const i of increments) {
      if (typeof i.id === 'number' && i.id > maxId) maxId = i.id
    }
  }
  const id = maxId + 1
  const paddedId = String(id).padStart(3, '0')
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  const filename = `${paddedId}-${slug}.md`
  const today = new Date().toISOString().slice(0, 10)

  const frontmatter = {
    id,
    title,
    status: 'pending',
    type,
    lane,
    parent: parent ?? null,
    depends_on: null,
    priority: typeof priority === 'string' ? parseInt(priority, 10) : priority,
    created: today,
    spec: spec ?? null,
    spec_section: spec_section ?? null,
  }

  const body = `
# ${title}

## Context
[What exists and why this change matters]

## Scope
[What will change]

## Files Affected
- [file path] ([create/modify] — [why])

## Verification
- Run: [test command]
- Expected: [what passing looks like]

## Spec Impact
- [which spec files may need updating]

## Progress
[Updated during implementation]
`

  await writeFile(join(base, 'pending', filename), serializeFrontmatter(frontmatter, body))
  console.log(filename)
}

/**
 * Move an increment from pending/ to active/, set status: active.
 */
export async function activate(filename) {
  const base = INCREMENTS_DIR()
  const { frontmatter } = await movePendingToActive(base, filename)

  // Update context.json
  const scope = frontmatter.spec ? [frontmatter.spec] : []
  await updateContext(filename, scope)

  console.log(frontmatter.title ?? filename)
}

/**
 * Move an increment from active/ to done/, set status: done.
 */
export async function finish(filename) {
  const base = INCREMENTS_DIR()
  const src = join(base, 'active', filename)
  if (!existsSync(src)) {
    console.error(`Increment not found in active/: ${filename}`)
    process.exit(1)
  }
  const content = await readFile(src, 'utf8')
  const { frontmatter, body } = parseFrontmatter(content)
  frontmatter.status = 'done'
  frontmatter.finished_at = new Date().toISOString().slice(0, 10)
  await mkdir(join(base, 'done'), { recursive: true })
  await writeFile(join(base, 'done', filename), serializeFrontmatter(frontmatter, body))
  await unlink(src)

  const nextChild = frontmatter.parent == null ? null : await findNextPendingChild(base, frontmatter.parent)
  if (nextChild) {
    const { frontmatter: nextFrontmatter } = await movePendingToActive(base, nextChild._file)
    const scope = nextFrontmatter.spec ? [nextFrontmatter.spec] : []
    await updateContext(nextChild._file, scope)
  } else {
    await updateContext(null, [])
  }

  console.log(frontmatter.title ?? filename)
}

/**
 * Move an increment from done/ to archived/.
 */
export async function archive(filename) {
  const base = INCREMENTS_DIR()
  const src = join(base, 'done', filename)
  if (!existsSync(src)) {
    console.error(`Increment not found in done/: ${filename}`)
    process.exit(1)
  }
  const archivedDir = join(base, 'archived')
  await mkdir(archivedDir, { recursive: true })
  await rename(src, join(archivedDir, filename))
  const content = await readFile(join(archivedDir, filename), 'utf8')
  const { frontmatter } = parseFrontmatter(content)
  console.log(frontmatter.title ?? filename)
}

/**
 * Update a frontmatter field on an increment file.
 */
export async function set(filename, key, value) {
  const base = INCREMENTS_DIR()
  const searchDirs = [
    join(base, 'active'),
    join(base, 'pending'),
    join(base, 'done'),
  ]
  const archivedDir = join(base, 'archived')
  if (existsSync(archivedDir)) {
    searchDirs.push(archivedDir)
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
    console.error(`Increment not found: ${filename}`)
    process.exit(1)
  }

  const content = await readFile(fullPath, 'utf8')
  const { frontmatter, body } = parseFrontmatter(content)

  let parsed = value
  if (/^\d+$/.test(value)) {
    parsed = parseInt(value, 10)
  }

  frontmatter[key] = parsed
  await writeFile(fullPath, serializeFrontmatter(frontmatter, body))
  console.log(typeof parsed === 'string' ? parsed : JSON.stringify(parsed))
}

/**
 * Create a batch parent increment in active/ with child increments in pending/.
 */
export async function group(options = {}) {
  const { title, children: childrenJson } = options
  if (!title) {
    console.error('Usage: esperkit increment group --title <title> [--children <json>]')
    process.exit(1)
  }

  const base = INCREMENTS_DIR()
  await mkdir(join(base, 'active'), { recursive: true })
  await mkdir(join(base, 'pending'), { recursive: true })

  // Compute next ID for parent
  const allDirs = [join(base, 'pending'), join(base, 'active'), join(base, 'done')]
  const archivedDir = join(base, 'archived')
  if (existsSync(archivedDir)) allDirs.push(archivedDir)

  let maxId = 0
  for (const dir of allDirs) {
    const incs = await readIncrementsFromDir(dir)
    for (const i of incs) {
      if (typeof i.id === 'number' && i.id > maxId) maxId = i.id
    }
  }

  const parentId = maxId + 1
  const paddedParentId = String(parentId).padStart(3, '0')
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  const parentFilename = `${paddedParentId}-${slug}.md`
  const today = new Date().toISOString().slice(0, 10)

  const parentFm = {
    id: parentId,
    title,
    status: 'active',
    type: 'batch',
    lane: 'systematic',
    parent: null,
    depends_on: null,
    priority: 1,
    created: today,
    spec: null,
    spec_section: null,
  }

  let children = []
  if (childrenJson) {
    try { children = JSON.parse(childrenJson) } catch { children = [] }
  }

  let queueSection = '\n## Queue\n'
  let nextChildId = parentId + 1
  let activeChild = null
  for (const child of children) {
    const cId = nextChildId++
    const cPadded = String(cId).padStart(3, '0')
    const cSlug = (child.title ?? 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
    const cFilename = `${cPadded}-${cSlug}.md`
    const isFirstChild = activeChild == null

    const cFm = {
      id: cId,
      title: child.title ?? 'Untitled',
      status: isFirstChild ? 'active' : 'pending',
      type: child.type ?? 'feature',
      lane: child.lane ?? 'atomic',
      parent: parentId,
      depends_on: null,
      priority: child.priority ?? 1,
      created: today,
      spec: child.spec ?? null,
      spec_section: child.spec_section ?? null,
    }

    const cBody = `\n# ${child.title ?? 'Untitled'}\n\n## Context\n\n## Scope\n\n## Files Affected\n\n## Verification\n\n## Spec Impact\n\n## Progress\n`
    const childDir = isFirstChild ? 'active' : 'pending'
    await writeFile(join(base, childDir, cFilename), serializeFrontmatter(cFm, cBody))
    if (isFirstChild) {
      activeChild = { filename: cFilename, scope: cFm.spec ? [cFm.spec] : [] }
    }
    queueSection += `- ${cPadded}: ${child.title ?? 'Untitled'}\n`
  }

  const parentBody = `\n# ${title}\n${queueSection}`
  await writeFile(join(base, 'active', parentFilename), serializeFrontmatter(parentFm, parentBody))

  // Update context
  if (activeChild) {
    await updateContext(activeChild.filename, activeChild.scope)
  } else {
    await updateContext(null, [])
  }

  console.log(parentFilename)
}
