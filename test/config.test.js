import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
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

async function setupEsperProject() {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-config-test-'))
  await mkdir(join(tmp, '.esper'), { recursive: true })
  await writeFile(join(tmp, '.esper', 'esper.json'), JSON.stringify({
    backlog_mode: 'local',
    current_phase: 'phase-2',
    commands: { test: '', lint: '', typecheck: '', dev: '' }
  }, null, 2) + '\n')
  return tmp
}

test('config check — exits 0 in esper project', async () => {
  const tmp = await setupEsperProject()
  try {
    const result = runCLI(['config', 'check'], tmp)
    assert.equal(result.status, 0)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('config check — exits 1 outside esper project', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-config-test-'))
  try {
    const result = runCLI(['config', 'check'], tmp)
    assert.equal(result.status, 1)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('config get — prints full JSON when no key given', async () => {
  const tmp = await setupEsperProject()
  try {
    const result = runCLI(['config', 'get'], tmp)
    assert.equal(result.status, 0)
    const json = JSON.parse(result.stdout)
    assert.equal(json.current_phase, 'phase-2')
    assert.equal(json.backlog_mode, 'local')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('config get — prints string value for a key', async () => {
  const tmp = await setupEsperProject()
  try {
    const result = runCLI(['config', 'get', 'current_phase'], tmp)
    assert.equal(result.status, 0)
    assert.equal(result.stdout.trim(), 'phase-2')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('config get — prints object value as JSON', async () => {
  const tmp = await setupEsperProject()
  try {
    const result = runCLI(['config', 'get', 'commands'], tmp)
    assert.equal(result.status, 0)
    const json = JSON.parse(result.stdout)
    assert.equal(json.test, '')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('config get — exits 1 for unknown key', async () => {
  const tmp = await setupEsperProject()
  try {
    const result = runCLI(['config', 'get', 'nonexistent'], tmp)
    assert.equal(result.status, 1)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('config set — updates a string value', async () => {
  const tmp = await setupEsperProject()
  try {
    const result = runCLI(['config', 'set', 'current_phase', 'phase-3'], tmp)
    assert.equal(result.status, 0)
    assert.equal(result.stdout.trim(), 'phase-3')

    // Verify the file was updated
    const raw = await readFile(join(tmp, '.esper', 'esper.json'), 'utf8')
    const json = JSON.parse(raw)
    assert.equal(json.current_phase, 'phase-3')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('config set — parses JSON values', async () => {
  const tmp = await setupEsperProject()
  try {
    const result = runCLI(['config', 'set', 'commands', '{"test":"npm test","lint":""}'], tmp)
    assert.equal(result.status, 0)

    const raw = await readFile(join(tmp, '.esper', 'esper.json'), 'utf8')
    const json = JSON.parse(raw)
    assert.equal(json.commands.test, 'npm test')
    assert.equal(json.commands.lint, '')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('install remains the default when no subcommand given', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-config-test-'))
  try {
    const result = spawnSync(process.execPath, [CLI], {
      env: { ...process.env, ESPER_SKILLS_DIR: tmp },
      encoding: 'utf8',
    })
    assert.equal(result.status, 0)
    assert.ok(result.stdout.includes('Installing esperkit skills'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})
