import { readFile, writeFile, readdir } from 'fs/promises'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { parseFrontmatter } from './frontmatter.js'

const CONTEXT_JSON = () => join(process.cwd(), '.esper', 'context.json')
const ESPER_JSON = () => join(process.cwd(), '.esper', 'esper.json')

/**
 * Build a fresh context object by scanning current project state.
 */
export async function build() {
  const esperPath = ESPER_JSON()
  if (!existsSync(esperPath)) {
    return {
      schema_version: 1,
      spec_root: 'specs',
      constitution_path: null,
      active_increment: null,
      active_increment_scope: [],
      workflow_mode: 'atom',
      commands: { test: '', lint: '', typecheck: '', dev: '' },
    }
  }

  const config = JSON.parse(await readFile(esperPath, 'utf8'))
  const specRoot = config.spec_root ?? 'specs'
  const wd = config.workflow_defaults ?? {}

  const constitutionPath = existsSync(join(process.cwd(), '.esper', 'CONSTITUTION.md'))
    ? '.esper/CONSTITUTION.md'
    : null

  // Scan for active increment
  let activeIncrement = null
  let activeIncrementScope = []
  const activeDir = join(process.cwd(), '.esper', 'increments', 'active')
  if (existsSync(activeDir)) {
    const files = await readdir(activeDir)
    const activeFiles = []
    for (const file of files.filter(f => f.endsWith('.md')).sort()) {
      const content = await readFile(join(activeDir, file), 'utf8')
      const { frontmatter } = parseFrontmatter(content)
      activeFiles.push({ file, frontmatter })
    }

    const preferred = activeFiles.find(entry => entry.frontmatter.type !== 'batch')
    if (preferred) {
      activeIncrement = preferred.file
      if (preferred.frontmatter.spec) {
        activeIncrementScope = [preferred.frontmatter.spec]
      }
    }
  }

  return {
    schema_version: config.schema_version ?? 1,
    spec_root: specRoot,
    constitution_path: constitutionPath,
    active_increment: activeIncrement,
    active_increment_scope: activeIncrementScope,
    workflow_mode: wd.default_work_mode ?? 'atom',
    commands: config.commands ?? { test: '', lint: '', typecheck: '', dev: '' },
  }
}

/**
 * Read context.json and print to stdout.
 */
export async function get() {
  const path = CONTEXT_JSON()
  if (!existsSync(path)) {
    console.error('No context.json found. Run `esperkit init` first.')
    process.exit(1)
  }
  const raw = await readFile(path, 'utf8')
  console.log(raw.trim())
}

/**
 * Write context data to context.json.
 */
export async function write(data) {
  await writeFile(CONTEXT_JSON(), JSON.stringify(data, null, 2) + '\n')
}

/**
 * Merge a patch into existing context.json.
 */
export async function update(patch) {
  const path = CONTEXT_JSON()
  let existing = {}
  if (existsSync(path)) {
    existing = JSON.parse(await readFile(path, 'utf8'))
  }
  const merged = { ...existing, ...patch }
  await writeFile(path, JSON.stringify(merged, null, 2) + '\n')
  return merged
}
