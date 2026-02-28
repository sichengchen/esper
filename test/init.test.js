import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CLI = join(__dirname, '..', 'bin', 'cli.js')

function runCLI(args, cwd) {
  return spawnSync(process.execPath, [CLI, ...args], {
    cwd,
    encoding: 'utf8',
  })
}

test('init — creates all expected directories and files', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-init-test-'))
  try {
    const result = runCLI(['init'], tmp)
    assert.equal(result.status, 0, `Init failed:\n${result.stderr}`)
    assert.ok(result.stdout.includes('Project initialized'))

    // Directories
    assert.ok(existsSync(join(tmp, '.esper')))
    assert.ok(existsSync(join(tmp, '.esper', 'increments', 'pending')))
    assert.ok(existsSync(join(tmp, '.esper', 'increments', 'active')))
    assert.ok(existsSync(join(tmp, '.esper', 'increments', 'done')))
    assert.ok(existsSync(join(tmp, '.esper', 'increments', 'archived')))
    assert.ok(existsSync(join(tmp, 'specs')))
    assert.ok(existsSync(join(tmp, 'specs', 'system')))
    assert.ok(existsSync(join(tmp, 'specs', 'product')))
    assert.ok(existsSync(join(tmp, 'specs', 'interfaces')))
    assert.ok(existsSync(join(tmp, 'specs', '_work')))

    // Files
    assert.ok(existsSync(join(tmp, '.esper', 'esper.json')))
    assert.ok(existsSync(join(tmp, '.esper', 'context.json')))
    assert.ok(existsSync(join(tmp, '.esper', 'WORKFLOW.md')))
    assert.ok(existsSync(join(tmp, '.esper', 'CONSTITUTION.md')))
    assert.ok(existsSync(join(tmp, 'specs', 'index.md')))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('init — is non-destructive on second run', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-init-test-'))
  try {
    runCLI(['init'], tmp)

    // Modify a file
    const { writeFile } = await import('node:fs/promises')
    await writeFile(join(tmp, '.esper', 'CONSTITUTION.md'), '# My Custom Constitution\n')

    // Run again
    const result = runCLI(['init'], tmp)
    assert.equal(result.status, 0)
    assert.ok(result.stdout.includes('Skipped'))

    // File should be preserved
    const content = await readFile(join(tmp, '.esper', 'CONSTITUTION.md'), 'utf8')
    assert.ok(content.includes('My Custom Constitution'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('init — creates valid esper.json with schema_version', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-init-test-'))
  try {
    runCLI(['init'], tmp)
    const raw = await readFile(join(tmp, '.esper', 'esper.json'), 'utf8')
    const config = JSON.parse(raw)
    assert.equal(config.schema_version, 1)
    assert.equal(config.spec_root, 'specs')
    assert.ok(config.workflow_defaults)
    assert.equal(config.workflow_defaults.default_work_mode, 'atom')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('init — creates valid context.json', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-init-test-'))
  try {
    runCLI(['init'], tmp)
    const raw = await readFile(join(tmp, '.esper', 'context.json'), 'utf8')
    const ctx = JSON.parse(raw)
    assert.equal(ctx.schema_version, 1)
    assert.equal(ctx.spec_root, 'specs')
    assert.equal(ctx.active_increment, null)
    assert.ok(Array.isArray(ctx.active_increment_scope))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('init — creates WORKFLOW.md with expected markers', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-init-test-'))
  try {
    runCLI(['init'], tmp)
    const content = await readFile(join(tmp, '.esper', 'WORKFLOW.md'), 'utf8')
    assert.ok(content.includes('context.json'))
    assert.ok(content.includes('CONSTITUTION.md'))
    assert.ok(content.includes('increment'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('init --spec_root — creates spec tree at custom path', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-init-test-'))
  try {
    const result = runCLI(['init', '--spec_root', 'docs/specs'], tmp)
    assert.equal(result.status, 0)
    assert.ok(existsSync(join(tmp, 'docs', 'specs')))
    assert.ok(existsSync(join(tmp, 'docs', 'specs', 'index.md')))

    const raw = await readFile(join(tmp, '.esper', 'esper.json'), 'utf8')
    const config = JSON.parse(raw)
    assert.equal(config.spec_root, 'docs/specs')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})
