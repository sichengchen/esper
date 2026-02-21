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
  const tmp = await mkdtemp(join(tmpdir(), 'esper-gh-test-'))
  await mkdir(join(tmp, '.esper'), { recursive: true })
  await writeFile(join(tmp, '.esper', 'esper.json'), JSON.stringify({
    backlog_mode: 'github',
    current_phase: '001-test-phase',
    commands: { test: '', lint: '', typecheck: '', dev: '' }
  }, null, 2) + '\n')
  await mkdir(join(tmp, '.esper', 'plans', 'pending'), { recursive: true })
  await mkdir(join(tmp, '.esper', 'plans', 'active'), { recursive: true })
  await mkdir(join(tmp, '.esper', 'plans', 'done'), { recursive: true })
  return tmp
}

test('create-issue — exits 1 for missing plan', async () => {
  const tmp = await setupEsperProject()
  try {
    const result = runCLI(['plan', 'create-issue', 'nonexistent.md'], tmp)
    assert.equal(result.status, 1)
    assert.ok(result.stderr.includes('Plan not found'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('create-issue — skips if gh_issue already set', async () => {
  const tmp = await setupEsperProject()
  try {
    await writeFile(join(tmp, '.esper', 'plans', 'pending', '001-test.md'),
      '---\nid: 1\ntitle: Test plan\nstatus: pending\ngh_issue: 42\n---\n\n# Test\n')

    const result = runCLI(['plan', 'create-issue', '001-test.md'], tmp)
    assert.equal(result.status, 0)
    assert.equal(result.stdout.trim(), '42')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('close-issue — exits 0 silently when no gh_issue set', async () => {
  const tmp = await setupEsperProject()
  try {
    await writeFile(join(tmp, '.esper', 'plans', 'done', '001-test.md'),
      '---\nid: 1\ntitle: Test plan\nstatus: done\n---\n\n# Test\n')

    const result = runCLI(['plan', 'close-issue', '001-test.md'], tmp)
    assert.equal(result.status, 0)
    // Should be silent (no output) — it's a no-op
    assert.equal(result.stdout.trim(), '')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('close-issue — exits 1 for missing plan', async () => {
  const tmp = await setupEsperProject()
  try {
    const result = runCLI(['plan', 'close-issue', 'nonexistent.md'], tmp)
    assert.equal(result.status, 1)
    assert.ok(result.stderr.includes('Plan not found'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('check-gh — validates gh CLI availability', async () => {
  // This test checks that check-gh runs without crashing.
  // It will exit 0 if gh is installed and authenticated, or exit 1 with a message if not.
  const tmp = await mkdtemp(join(tmpdir(), 'esper-gh-test-'))
  try {
    const result = runCLI(['config', 'check-gh'], tmp)
    // Either 0 (gh available) or 1 (not available) — both are valid
    assert.ok(result.status === 0 || result.status === 1)
    if (result.status === 1) {
      assert.ok(
        result.stderr.includes('gh CLI not found') ||
        result.stderr.includes('gh CLI not authenticated')
      )
    }
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})
