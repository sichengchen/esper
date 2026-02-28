import { readFile, writeFile, readdir, mkdir, rename } from 'fs/promises'
import { existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { parseFrontmatter, serializeFrontmatter } from './frontmatter.js'

const ESPER_JSON = () => join(process.cwd(), '.esper', 'esper.json')

function resolveSpecRoot() {
  const path = ESPER_JSON()
  if (!existsSync(path)) return join(process.cwd(), 'specs')
  const raw = readFileSync(path, 'utf8')
  const json = JSON.parse(raw)
  return join(process.cwd(), json.spec_root ?? 'specs')
}

/**
 * Read and print the spec index file.
 */
export async function index() {
  const specRoot = resolveSpecRoot()
  const indexPath = join(specRoot, 'index.md')
  if (!existsSync(indexPath)) {
    console.error(`Spec index not found: ${indexPath}`)
    process.exit(1)
  }
  const content = await readFile(indexPath, 'utf8')
  console.log(content.trim())
}

/**
 * Read and print a specific spec file.
 */
export async function get(filePath) {
  if (!filePath) {
    console.error('Usage: esperkit spec get <file>')
    process.exit(1)
  }
  const specRoot = resolveSpecRoot()
  const fullPath = join(specRoot, filePath)
  if (!existsSync(fullPath)) {
    console.error(`Spec not found: ${filePath}`)
    process.exit(1)
  }
  const content = await readFile(fullPath, 'utf8')
  console.log(content.trim())
}

/**
 * Create a new spec file with frontmatter scaffold.
 */
export async function create(filePath) {
  if (!filePath) {
    console.error('Usage: esperkit spec create <path>')
    process.exit(1)
  }
  const specRoot = resolveSpecRoot()
  const fullPath = join(specRoot, filePath)
  if (existsSync(fullPath)) {
    console.log(`Spec already exists: ${filePath}`)
    return
  }
  const dir = dirname(fullPath)
  await mkdir(dir, { recursive: true })
  const today = new Date().toISOString().slice(0, 10)
  const name = filePath.replace(/\.md$/, '').split('/').pop()
  const content = serializeFrontmatter(
    { status: 'draft', created: today },
    `\n# ${name}\n\n## Overview\n\n## Details\n`
  )
  await writeFile(fullPath, content)
  console.log(filePath)
}

/**
 * Update spec_root in config.
 */
export async function setRoot(newRoot) {
  if (!newRoot) {
    console.error('Usage: esperkit spec set-root <path>')
    process.exit(1)
  }
  const esperPath = ESPER_JSON()
  if (!existsSync(esperPath)) {
    console.error('No esper.json found. Run `esperkit init` first.')
    process.exit(1)
  }
  const raw = await readFile(esperPath, 'utf8')
  const json = JSON.parse(raw)
  json.spec_root = newRoot
  await writeFile(esperPath, JSON.stringify(json, null, 2) + '\n')
  // Create the directory if needed
  const fullPath = join(process.cwd(), newRoot)
  await mkdir(fullPath, { recursive: true })
  console.log(newRoot)
}

/**
 * Archive a spec file (move to _archived/ and update status).
 */
export async function archive(filePath) {
  if (!filePath) {
    console.error('Usage: esperkit spec archive <file>')
    process.exit(1)
  }
  const specRoot = resolveSpecRoot()
  const src = join(specRoot, filePath)
  if (!existsSync(src)) {
    console.error(`Spec not found: ${filePath}`)
    process.exit(1)
  }
  const archivedDir = join(specRoot, '_archived')
  await mkdir(archivedDir, { recursive: true })
  const content = await readFile(src, 'utf8')
  const { frontmatter, body } = parseFrontmatter(content)
  frontmatter.status = 'archived'
  const filename = filePath.split('/').pop()
  await writeFile(join(archivedDir, filename), serializeFrontmatter(frontmatter, body))
  const { unlink } = await import('fs/promises')
  await unlink(src)
  console.log(frontmatter.title ?? filename)
}

/**
 * List all spec files with frontmatter metadata.
 */
export async function list() {
  const specRoot = resolveSpecRoot()
  if (!existsSync(specRoot)) {
    console.log('No spec tree found.')
    return
  }
  const results = []
  await scanDir(specRoot, specRoot, results)
  if (results.length === 0) {
    console.log('No spec files found.')
    return
  }
  console.log(JSON.stringify(results, null, 2))
}

async function scanDir(base, dir, results) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name.startsWith('_')) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      await scanDir(base, full, results)
    } else if (entry.name.endsWith('.md')) {
      const content = await readFile(full, 'utf8')
      const { frontmatter } = parseFrontmatter(content)
      const rel = full.slice(base.length + 1)
      results.push({ path: rel, ...frontmatter })
    }
  }
}

/**
 * Create default spec tree directories and template index.md if missing.
 */
export async function ensureTree(specRoot) {
  const root = specRoot ?? resolveSpecRoot()
  const dirs = ['system', 'product', 'interfaces', '_work']
  for (const d of dirs) {
    await mkdir(join(root, d), { recursive: true })
  }
  const indexPath = join(root, 'index.md')
  if (!existsSync(indexPath)) {
    const { readFile: readTpl } = await import('fs/promises')
    const tplPath = join(dirname(new URL(import.meta.url).pathname), 'templates', 'spec-index.md')
    let content
    if (existsSync(tplPath)) {
      content = await readTpl(tplPath, 'utf8')
    } else {
      content = `# Spec Index\n\n## System\n- system/\n\n## Product\n- product/\n\n## Interfaces\n- interfaces/\n`
    }
    await writeFile(indexPath, content)
  }
}
