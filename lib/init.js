import { writeFile, mkdir, chmod } from 'fs/promises'
import { existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { defaults } from './config.js'
import { build, write as writeContext } from './context.js'
import { ensureTree } from './spec.js'

const MODULE_DIR = dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = join(MODULE_DIR, '..')

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

  const rootDocs = [
    ['AGENTS.md', generateBootstrapDoc('AGENTS')],
    ['CLAUDE.md', generateBootstrapDoc('CLAUDE')],
  ]
  for (const [filename, content] of rootDocs) {
    const filePath = join(cwd, filename)
    if (!existsSync(filePath)) {
      await writeFile(filePath, content)
      created.push(filename)
    } else {
      skipped.push(filename)
    }
  }

  // Write CONSTITUTION.md placeholder
  const constPath = join(esperDir, 'CONSTITUTION.md')
  if (!existsSync(constPath)) {
    await writeFile(constPath, '# Constitution\n\n[Project vision, scope, and constraints go here.]\n')
    created.push('CONSTITUTION.md')
  } else {
    skipped.push('CONSTITUTION.md')
  }

  // Write context.json after the constitution exists so build() can include it.
  const ctxPath = join(esperDir, 'context.json')
  if (!existsSync(ctxPath)) {
    const ctx = await build()
    await writeContext(ctx)
    created.push('context.json')
  } else {
    skipped.push('context.json')
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
  await writeHookScripts({ hooksDir, commands: config.commands, created, skipped })

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

async function writeHookScripts({ hooksDir, commands, created, skipped }) {
  const sessionReminderPath = join(hooksDir, 'session-reminder.sh')
  if (!existsSync(sessionReminderPath)) {
    const templatePath = join(PACKAGE_ROOT, 'hooks', 'session-reminder.sh')
    await writeFile(sessionReminderPath, readFileSync(templatePath, 'utf8'))
    await chmod(sessionReminderPath, 0o755)
    created.push('hooks/session-reminder.sh')
  } else {
    skipped.push('hooks/session-reminder.sh')
  }

  const verifyQuickPath = join(hooksDir, 'verify-quick.sh')
  if (!existsSync(verifyQuickPath)) {
    await writeFile(verifyQuickPath, generateVerifyQuickHook(commands))
    await chmod(verifyQuickPath, 0o755)
    created.push('hooks/verify-quick.sh')
  } else {
    skipped.push('hooks/verify-quick.sh')
  }
}

function generateVerifyQuickHook(commands = {}) {
  const checks = [
    ['lint', commands.lint],
    ['typecheck', commands.typecheck],
    ['test', commands.test],
  ].filter(([, command]) => Boolean(command))

  if (checks.length === 0) {
    return `#!/usr/bin/env bash
# Generated by \`esperkit init\`. Runs configured quick checks for this project.

echo "esper: no quick verification commands configured."
exit 0
`
  }

  const lines = [
    '#!/usr/bin/env bash',
    '# Generated by `esperkit init`. Runs configured quick checks for this project.',
    '',
    'FAILED=0',
    '',
  ]

  for (const [name, command] of checks) {
    lines.push(`echo "--- esper: ${name} ---"`)
    lines.push(command)
    lines.push('if [ $? -ne 0 ]; then')
    lines.push('  FAILED=1')
    lines.push('fi')
    lines.push('')
  }

  lines.push('if [ "$FAILED" -ne 0 ]; then')
  lines.push('  echo "esper: quick verification failed"')
  lines.push('  exit 1')
  lines.push('fi')
  lines.push('')
  lines.push('echo "esper: quick verification passed"')
  lines.push('exit 0')
  lines.push('')

  return lines.join('\n')
}

function generateBootstrapDoc(kind) {
  const title = kind === 'CLAUDE' ? 'CLAUDE' : 'AGENTS'
  const intro = kind === 'CLAUDE'
    ? 'Claude Code should use the Esper workflow for planning, implementation, and review.'
    : 'Use this file to bootstrap any coding agent into the Esper workflow.'
  const commandNote = kind === 'CLAUDE'
    ? '\n## Claude Shortcuts\n\nUse the `/e:*` slash commands when available (`/e:init`, `/e:ctx`, `/e:atom`, `/e:batch`, `/e:go`, `/e:review`, `/e:sync`).\n'
    : ''

  return `# ${title}

${intro}

## EsperKit

Keep project-specific instructions outside this section. The \`esper:init\` workflow may update only this block.

### Required Reads

1. Read \`.esper/context.json\` for machine-readable project state.
2. Read \`.esper/CONSTITUTION.md\` for project scope and constraints.
3. Read \`.esper/WORKFLOW.md\` for the canonical Esper workflow.
4. If \`active_increment\` is set, read the matching file under \`.esper/increments/active/\`.
5. Read the relevant spec files under the configured \`spec_root\` from \`.esper/context.json\`.

### Source of Truth

- \`.esper/context.json\` is the runtime context shared across tools.
- \`.esper/WORKFLOW.md\` defines the operational workflow.
- The configured \`spec_root\` is the authoritative spec tree.

### Verification

- Read the \`commands\` object in \`.esper/context.json\` for the exact test, lint, typecheck, and dev commands.
- Run the configured commands before closing an increment.${commandNote}
`
}
