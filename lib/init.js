import { writeFile, mkdir } from 'fs/promises'
import { existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { defaults } from './config.js'
import { build, write as writeContext } from './context.js'
import { ensureTree } from './spec.js'

/**
 * Bootstrap a new esper project.
 */
export async function run(options = {}) {
  const cwd = process.cwd()
  const esperDir = join(cwd, '.esper')
  const created = []
  const skipped = []

  // Create .esper/
  await mkdir(esperDir, { recursive: true })

  // Write esper.json
  const esperJsonPath = join(esperDir, 'esper.json')
  if (!existsSync(esperJsonPath)) {
    const config = defaults()
    if (options.spec_root) config.spec_root = options.spec_root
    if (options.workflow_defaults) {
      config.workflow_defaults = { ...config.workflow_defaults, ...options.workflow_defaults }
    }
    await writeFile(esperJsonPath, JSON.stringify(config, null, 2) + '\n')
    created.push('esper.json')
  } else {
    skipped.push('esper.json')
  }

  // Read config for spec_root
  const config = JSON.parse(readFileSync(esperJsonPath, 'utf8'))
  const specRoot = options.spec_root ?? config.spec_root ?? 'specs'

  // Write context.json
  const ctxPath = join(esperDir, 'context.json')
  if (!existsSync(ctxPath)) {
    const ctx = await build()
    await writeContext(ctx)
    created.push('context.json')
  } else {
    skipped.push('context.json')
  }

  // Write WORKFLOW.md
  const workflowPath = join(esperDir, 'WORKFLOW.md')
  if (!existsSync(workflowPath)) {
    const tplPath = join(dirname(new URL(import.meta.url).pathname), 'templates', 'WORKFLOW.md')
    let content
    if (existsSync(tplPath)) {
      content = readFileSync(tplPath, 'utf8')
    } else {
      content = generateWorkflowTemplate(specRoot, config.commands)
    }
    await writeFile(workflowPath, content)
    created.push('WORKFLOW.md')
  } else {
    skipped.push('WORKFLOW.md')
  }

  // Write CONSTITUTION.md placeholder
  const constPath = join(esperDir, 'CONSTITUTION.md')
  if (!existsSync(constPath)) {
    await writeFile(constPath, '# Constitution\n\n[Project vision, scope, and constraints go here.]\n')
    created.push('CONSTITUTION.md')
  } else {
    skipped.push('CONSTITUTION.md')
  }

  // Create increment directories
  const incDirs = ['pending', 'active', 'done', 'archived']
  for (const d of incDirs) {
    const p = join(esperDir, 'increments', d)
    await mkdir(p, { recursive: true })
  }
  created.push('increments/')

  // Create spec tree
  const specRootPath = join(cwd, specRoot)
  await ensureTree(specRootPath)
  created.push(`${specRoot}/`)

  // Create hooks dir
  const hooksDir = join(esperDir, 'hooks')
  await mkdir(hooksDir, { recursive: true })

  // Summary
  if (created.length > 0) {
    console.log('Created:')
    for (const f of created) console.log(`  + ${f}`)
  }
  if (skipped.length > 0) {
    console.log('Skipped (already exists):')
    for (const f of skipped) console.log(`  ~ ${f}`)
  }
  console.log('\nProject initialized.')
}

function generateWorkflowTemplate(specRoot, commands) {
  return `# Workflow

## Before Making Changes

1. Read \`.esper/context.json\` to understand the current state.
2. Read \`.esper/CONSTITUTION.md\` for project vision and constraints.
3. Check for an active increment in \`.esper/increments/active/\`.
4. Read the relevant spec files under \`${specRoot}/\`.

## Active Increment

If an active increment exists, it is the authoritative work file.
Follow its Scope and Verification sections.

## Spec Authority

The spec tree at \`${specRoot}/\` is the source of truth for system behavior.
Update specs when implementation diverges from documented behavior.

## Verification

Run these commands to validate changes:
- Test: \`${commands?.test || '[not configured]'}\`
- Lint: \`${commands?.lint || '[not configured]'}\`
- Typecheck: \`${commands?.typecheck || '[not configured]'}\`
`
}
