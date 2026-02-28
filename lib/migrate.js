import { readFile, writeFile, mkdir, readdir } from 'fs/promises'
import { existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { defaults } from './config.js'
import { build, write as writeContext } from './context.js'
import { ensureTree } from './spec.js'

/**
 * Migrate a v0.x project to v1.0 schema.
 */
export async function run() {
  const cwd = process.cwd()
  const esperDir = join(cwd, '.esper')
  const esperJson = join(esperDir, 'esper.json')

  if (!existsSync(esperJson)) {
    console.error('No esper.json found. Run `esperkit init` for a new project.')
    process.exit(1)
  }

  const changes = []

  // Read and update config
  const raw = await readFile(esperJson, 'utf8')
  const config = JSON.parse(raw)
  const defs = defaults()

  if (!config.schema_version) {
    config.schema_version = defs.schema_version
    changes.push('Added schema_version: 1')
  }

  if (!config.spec_root) {
    config.spec_root = defs.spec_root
    changes.push('Added spec_root: specs')
  }

  if (!config.workflow_defaults) {
    config.workflow_defaults = defs.workflow_defaults
    changes.push('Added workflow_defaults')
  }

  // Remove legacy field
  if (config.current_phase !== undefined) {
    delete config.current_phase
    changes.push('Removed current_phase')
  }

  await writeFile(esperJson, JSON.stringify(config, null, 2) + '\n')

  // Create spec tree
  const specRoot = config.spec_root ?? 'specs'
  const specRootPath = join(cwd, specRoot)
  if (!existsSync(specRootPath)) {
    await ensureTree(specRootPath)
    changes.push(`Created spec tree at ${specRoot}/`)
  } else if (!existsSync(join(specRootPath, 'index.md'))) {
    await ensureTree(specRootPath)
    changes.push('Created spec index.md')
  }

  // Create context.json
  const ctxPath = join(esperDir, 'context.json')
  if (!existsSync(ctxPath)) {
    const ctx = await build()
    await writeContext(ctx)
    changes.push('Created context.json')
  }

  // Create WORKFLOW.md
  const workflowPath = join(esperDir, 'WORKFLOW.md')
  if (!existsSync(workflowPath)) {
    const tplPath = join(dirname(new URL(import.meta.url).pathname), 'templates', 'WORKFLOW.md')
    let content
    if (existsSync(tplPath)) {
      content = readFileSync(tplPath, 'utf8')
    } else {
      content = `# Workflow\n\nRead .esper/context.json before making changes.\nCheck for active increments in .esper/increments/active/.\nSpec tree at ${specRoot}/ is authoritative.\n`
    }
    await writeFile(workflowPath, content)
    changes.push('Created WORKFLOW.md')
  }

  // Create increment directories
  const incBase = join(esperDir, 'increments')
  for (const d of ['pending', 'active', 'done', 'archived']) {
    const p = join(incBase, d)
    if (!existsSync(p)) {
      await mkdir(p, { recursive: true })
      changes.push(`Created increments/${d}/`)
    }
  }

  // Advisory for legacy files
  const plansDir = join(esperDir, 'plans')
  if (existsSync(plansDir)) {
    try {
      const planFiles = await readdir(plansDir, { recursive: true })
      const mdCount = planFiles.filter(f => f.endsWith('.md')).length
      if (mdCount > 0) {
        console.log(`\nAdvisory: Found ${mdCount} legacy plan file(s) in .esper/plans/.`)
        console.log('These are not migrated automatically. Review and convert to increments manually.')
      }
    } catch { /* ignore */ }
  }

  const phasesDir = join(esperDir, 'phases')
  if (existsSync(phasesDir)) {
    console.log('\nAdvisory: Found legacy phase files in .esper/phases/.')
    console.log('The phase model has been replaced by the spec/increment model.')
  }

  // Summary
  if (changes.length === 0) {
    console.log('Project is already up to date.')
  } else {
    console.log('\nMigration complete:')
    for (const c of changes) console.log(`  + ${c}`)
  }
}
