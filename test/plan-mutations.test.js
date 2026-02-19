import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, rm, readdir } from 'node:fs/promises'
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

const PLAN_PENDING = `---
id: 001
title: Test plan
status: pending
type: feature
priority: 2
phase: phase-2
branch: feature/phase-2
created: 2026-02-18
---

# Test plan
`

const PLAN_ACTIVE = `---
id: 002
title: Active plan
status: active
type: feature
priority: 1
phase: phase-2
branch: feature/phase-2
created: 2026-02-18
---

# Active plan
`

const PLAN_DONE_P1 = `---
id: 003
title: Done phase-1 plan
status: done
type: feature
priority: 1
phase: phase-1
branch: feature/phase-1
created: 2026-02-18
shipped_at: 2026-02-18
---

# Done phase-1 plan
`

const PLAN_DONE_P2 = `---
id: 004
title: Done phase-2 plan
status: done
type: feature
priority: 1
phase: phase-2
branch: feature/phase-2
created: 2026-02-18
shipped_at: 2026-02-18
---

# Done phase-2 plan
`

async function setupProject(plans = {}) {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-mut-test-'))
  await mkdir(join(tmp, '.esper'), { recursive: true })
  await writeFile(join(tmp, '.esper', 'esper.json'), JSON.stringify({
    backlog_mode: 'local',
    current_phase: 'phase-2',
    commands: {}
  }, null, 2) + '\n')

  for (const [dir, files] of Object.entries(plans)) {
    await mkdir(join(tmp, '.esper', 'plans', dir), { recursive: true })
    for (const [name, content] of Object.entries(files)) {
      await writeFile(join(tmp, '.esper', 'plans', dir, name), content)
    }
  }
  return tmp
}

// --- activate ---

test('plan activate — moves pending to active with status update', async () => {
  const tmp = await setupProject({ pending: { '001-test.md': PLAN_PENDING } })
  try {
    const result = runCLI(['plan', 'activate', '001-test.md'], tmp)
    assert.equal(result.status, 0)
    assert.ok(result.stdout.includes('Test plan'))
    assert.ok(!existsSync(join(tmp, '.esper', 'plans', 'pending', '001-test.md')))
    assert.ok(existsSync(join(tmp, '.esper', 'plans', 'active', '001-test.md')))

    const content = await readFile(join(tmp, '.esper', 'plans', 'active', '001-test.md'), 'utf8')
    assert.ok(content.includes('status: active'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('plan activate — exits 1 when file not in pending', async () => {
  const tmp = await setupProject({})
  try {
    const result = runCLI(['plan', 'activate', 'nonexistent.md'], tmp)
    assert.equal(result.status, 1)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

// --- suspend ---

test('plan suspend — moves active to pending with status update', async () => {
  const tmp = await setupProject({ active: { '002-active.md': PLAN_ACTIVE } })
  try {
    const result = runCLI(['plan', 'suspend', '002-active.md'], tmp)
    assert.equal(result.status, 0)
    assert.ok(!existsSync(join(tmp, '.esper', 'plans', 'active', '002-active.md')))
    assert.ok(existsSync(join(tmp, '.esper', 'plans', 'pending', '002-active.md')))

    const content = await readFile(join(tmp, '.esper', 'plans', 'pending', '002-active.md'), 'utf8')
    assert.ok(content.includes('status: pending'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('plan suspend — exits 1 when file not in active', async () => {
  const tmp = await setupProject({})
  try {
    const result = runCLI(['plan', 'suspend', 'nonexistent.md'], tmp)
    assert.equal(result.status, 1)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

// --- finish ---

test('plan finish — moves active to done with status and shipped_at', async () => {
  const tmp = await setupProject({ active: { '002-active.md': PLAN_ACTIVE } })
  try {
    const result = runCLI(['plan', 'finish', '002-active.md'], tmp)
    assert.equal(result.status, 0)
    assert.ok(!existsSync(join(tmp, '.esper', 'plans', 'active', '002-active.md')))
    assert.ok(existsSync(join(tmp, '.esper', 'plans', 'done', '002-active.md')))

    const content = await readFile(join(tmp, '.esper', 'plans', 'done', '002-active.md'), 'utf8')
    assert.ok(content.includes('status: done'))
    assert.ok(content.includes('shipped_at:'))
    // Should NOT have pr: field
    assert.ok(!content.includes('pr:'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('plan finish — exits 1 when file not in active', async () => {
  const tmp = await setupProject({})
  try {
    const result = runCLI(['plan', 'finish', 'nonexistent.md'], tmp)
    assert.equal(result.status, 1)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

// --- archive ---

test('plan archive — moves matching phase plans from done to archived', async () => {
  const tmp = await setupProject({
    done: { '003-done-p1.md': PLAN_DONE_P1, '004-done-p2.md': PLAN_DONE_P2 },
  })
  try {
    const result = runCLI(['plan', 'archive', 'phase-1'], tmp)
    assert.equal(result.status, 0)
    assert.ok(result.stdout.includes('1 plans archived'))

    // phase-1 plan moved to archived
    assert.ok(existsSync(join(tmp, '.esper', 'plans', 'archived', 'phase-1', '003-done-p1.md')))
    assert.ok(!existsSync(join(tmp, '.esper', 'plans', 'done', '003-done-p1.md')))

    // phase-2 plan stays in done
    assert.ok(existsSync(join(tmp, '.esper', 'plans', 'done', '004-done-p2.md')))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('plan archive — prints 0 when no matching plans', async () => {
  const tmp = await setupProject({ done: { '004-done-p2.md': PLAN_DONE_P2 } })
  try {
    const result = runCLI(['plan', 'archive', 'phase-1'], tmp)
    assert.equal(result.status, 0)
    assert.ok(result.stdout.includes('0 plans archived'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('plan archive — handles empty done directory', async () => {
  const tmp = await setupProject({})
  try {
    const result = runCLI(['plan', 'archive', 'phase-1'], tmp)
    assert.equal(result.status, 0)
    assert.ok(result.stdout.includes('0 plans archived'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

// --- set ---

test('plan set — updates existing frontmatter field', async () => {
  const tmp = await setupProject({ pending: { '001-test.md': PLAN_PENDING } })
  try {
    const result = runCLI(['plan', 'set', '001-test.md', 'priority', '1'], tmp)
    assert.equal(result.status, 0)
    assert.equal(result.stdout.trim(), '1')

    const content = await readFile(join(tmp, '.esper', 'plans', 'pending', '001-test.md'), 'utf8')
    assert.ok(content.includes('priority: 1'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('plan set — adds new frontmatter field', async () => {
  const tmp = await setupProject({ pending: { '001-test.md': PLAN_PENDING } })
  try {
    const result = runCLI(['plan', 'set', '001-test.md', 'pr', 'https://github.com/test/1'], tmp)
    assert.equal(result.status, 0)

    const content = await readFile(join(tmp, '.esper', 'plans', 'pending', '001-test.md'), 'utf8')
    assert.ok(content.includes('pr: https://github.com/test/1'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('plan set — finds plans in archived directories', async () => {
  const tmp = await setupProject({})
  await mkdir(join(tmp, '.esper', 'plans', 'archived', 'phase-1'), { recursive: true })
  await writeFile(join(tmp, '.esper', 'plans', 'archived', 'phase-1', '003-done.md'), PLAN_DONE_P1)
  try {
    const result = runCLI(['plan', 'set', '003-done.md', 'pr', 'https://example.com'], tmp)
    assert.equal(result.status, 0)

    const content = await readFile(join(tmp, '.esper', 'plans', 'archived', 'phase-1', '003-done.md'), 'utf8')
    assert.ok(content.includes('pr: https://example.com'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('plan set — exits 1 for missing plan', async () => {
  const tmp = await setupProject({})
  try {
    const result = runCLI(['plan', 'set', 'nonexistent.md', 'pr', 'url'], tmp)
    assert.equal(result.status, 1)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})
