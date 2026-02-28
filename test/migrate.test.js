import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
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

async function setupLegacyProject() {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-migrate-test-'))
  await mkdir(join(tmp, '.esper'), { recursive: true })
  await writeFile(join(tmp, '.esper', 'esper.json'), JSON.stringify({
    backlog_mode: 'local',
    current_phase: '002-test-phase',
    commands: { test: 'npm test', lint: '', typecheck: '', dev: '' },
  }, null, 2) + '\n')
  return tmp
}

test('migrate — adds schema_version to a v0.x project', async () => {
  const tmp = await setupLegacyProject()
  try {
    const result = runCLI(['migrate'], tmp)
    assert.equal(result.status, 0)
    const raw = await readFile(join(tmp, '.esper', 'esper.json'), 'utf8')
    const config = JSON.parse(raw)
    assert.equal(config.schema_version, 1)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('migrate — creates spec tree', async () => {
  const tmp = await setupLegacyProject()
  try {
    runCLI(['migrate'], tmp)
    assert.ok(existsSync(join(tmp, 'specs')))
    assert.ok(existsSync(join(tmp, 'specs', 'index.md')))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('migrate — creates context.json', async () => {
  const tmp = await setupLegacyProject()
  try {
    runCLI(['migrate'], tmp)
    assert.ok(existsSync(join(tmp, '.esper', 'context.json')))
    const ctx = JSON.parse(await readFile(join(tmp, '.esper', 'context.json'), 'utf8'))
    assert.equal(ctx.schema_version, 1)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('migrate — creates WORKFLOW.md', async () => {
  const tmp = await setupLegacyProject()
  try {
    runCLI(['migrate'], tmp)
    assert.ok(existsSync(join(tmp, '.esper', 'WORKFLOW.md')))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('migrate — creates increment directories', async () => {
  const tmp = await setupLegacyProject()
  try {
    runCLI(['migrate'], tmp)
    for (const d of ['pending', 'active', 'done', 'archived']) {
      assert.ok(existsSync(join(tmp, '.esper', 'increments', d)))
    }
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('migrate — preserves existing config values', async () => {
  const tmp = await setupLegacyProject()
  try {
    runCLI(['migrate'], tmp)
    const raw = await readFile(join(tmp, '.esper', 'esper.json'), 'utf8')
    const config = JSON.parse(raw)
    assert.equal(config.commands.test, 'npm test')
    assert.equal(config.backlog_mode, 'local')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('migrate — removes current_phase field', async () => {
  const tmp = await setupLegacyProject()
  try {
    runCLI(['migrate'], tmp)
    const raw = await readFile(join(tmp, '.esper', 'esper.json'), 'utf8')
    const config = JSON.parse(raw)
    assert.equal(config.current_phase, undefined)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('migrate — does not overwrite existing files', async () => {
  const tmp = await setupLegacyProject()
  // Create context.json first
  await writeFile(join(tmp, '.esper', 'context.json'), JSON.stringify({ custom: true }, null, 2) + '\n')
  try {
    runCLI(['migrate'], tmp)
    const ctx = JSON.parse(await readFile(join(tmp, '.esper', 'context.json'), 'utf8'))
    assert.equal(ctx.custom, true, 'Should not overwrite existing context.json')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('migrate — prints advisory for legacy plan files', async () => {
  const tmp = await setupLegacyProject()
  await mkdir(join(tmp, '.esper', 'plans', 'pending'), { recursive: true })
  await writeFile(join(tmp, '.esper', 'plans', 'pending', '001-test.md'), '---\nid: 1\ntitle: Old plan\n---\n')
  try {
    const result = runCLI(['migrate'], tmp)
    assert.ok(result.stdout.includes('legacy plan file'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})
