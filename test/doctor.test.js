import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
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

test('doctor — exits 0 on a healthy project', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-doctor-test-'))
  try {
    // Init first
    runCLI(['init'], tmp)
    const result = runCLI(['doctor'], tmp)
    assert.equal(result.status, 0, `Doctor failed:\n${result.stderr}\n${result.stdout}`)
    assert.ok(result.stdout.includes('[ok]'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('doctor — exits 1 when esper.json is missing', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-doctor-test-'))
  try {
    const result = runCLI(['doctor'], tmp)
    assert.equal(result.status, 1)
    assert.ok(result.stdout.includes('[fail]'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('doctor — warns when WORKFLOW.md is missing', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-doctor-test-'))
  try {
    runCLI(['init'], tmp)
    const { rm: rmFile } = await import('node:fs/promises')
    await rmFile(join(tmp, '.esper', 'WORKFLOW.md'))
    const result = runCLI(['doctor'], tmp)
    assert.equal(result.status, 0) // warn, not fail
    assert.ok(result.stdout.includes('[warn]'))
    assert.ok(result.stdout.includes('WORKFLOW.md'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('doctor — warns when test command is empty', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-doctor-test-'))
  try {
    runCLI(['init'], tmp)
    const result = runCLI(['doctor'], tmp)
    // Default init has empty test command
    assert.ok(result.stdout.includes('test command not configured'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})
