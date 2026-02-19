import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
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

async function setupPlansProject(plans = {}) {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-plan-test-'))
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

const PLAN_A = `---
id: 001
title: First plan
status: pending
type: feature
priority: 2
phase: phase-2
branch: feature/phase-2
created: 2026-02-18
---

# First plan
`

const PLAN_B = `---
id: 002
title: Second plan
status: pending
type: fix
priority: 1
phase: phase-2
branch: fix/second-plan
created: 2026-02-18
---

# Second plan
`

const PLAN_C = `---
id: 003
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

test('plan list — shows plans sorted by priority then id', async () => {
  const tmp = await setupPlansProject({
    pending: { '001-first.md': PLAN_A, '002-second.md': PLAN_B },
    active: { '003-active.md': PLAN_C },
  })
  try {
    const result = runCLI(['plan', 'list'], tmp)
    assert.equal(result.status, 0)
    const lines = result.stdout.trim().split('\n')
    // Priority 1 plans first (#002 fix and #003 active), then #001 (p2)
    assert.ok(lines[0].includes('#002'))
    assert.ok(lines[1].includes('#003'))
    assert.ok(lines[2].includes('#001'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('plan list --format json — returns valid JSON array', async () => {
  const tmp = await setupPlansProject({
    pending: { '001-first.md': PLAN_A },
  })
  try {
    const result = runCLI(['plan', 'list', '--format', 'json'], tmp)
    assert.equal(result.status, 0)
    const plans = JSON.parse(result.stdout)
    assert.equal(plans.length, 1)
    assert.equal(plans[0].id, 1)
    assert.equal(plans[0].title, 'First plan')
    assert.equal(plans[0]._file, undefined, 'Internal fields should be stripped')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('plan list --phase — filters by phase', async () => {
  const otherPhasePlan = `---
id: 099
title: Other phase
status: pending
type: feature
priority: 1
phase: phase-1
branch: feature/phase-1
created: 2026-02-18
---
`
  const tmp = await setupPlansProject({
    pending: { '001-first.md': PLAN_A, '099-other.md': otherPhasePlan },
  })
  try {
    const result = runCLI(['plan', 'list', '--phase', 'phase-2', '--format', 'json'], tmp)
    const plans = JSON.parse(result.stdout)
    assert.equal(plans.length, 1)
    assert.equal(plans[0].id, 1)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('plan list --type — filters by type', async () => {
  const tmp = await setupPlansProject({
    pending: { '001-first.md': PLAN_A, '002-second.md': PLAN_B },
  })
  try {
    const result = runCLI(['plan', 'list', '--type', 'fix', '--format', 'json'], tmp)
    const plans = JSON.parse(result.stdout)
    assert.equal(plans.length, 1)
    assert.equal(plans[0].type, 'fix')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('plan list — empty backlog prints message', async () => {
  const tmp = await setupPlansProject({})
  try {
    const result = runCLI(['plan', 'list'], tmp)
    assert.equal(result.status, 0)
    assert.ok(result.stdout.includes('No plans found'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('plan list --dir archived — scans archived subdirectories', async () => {
  const archivedPlan = `---
id: 010
title: Archived plan
status: done
type: feature
priority: 1
phase: phase-1
branch: feature/phase-1
created: 2026-02-18
shipped_at: 2026-02-18
---
`
  const tmp = await setupPlansProject({})
  await mkdir(join(tmp, '.esper', 'plans', 'archived', 'phase-1'), { recursive: true })
  await writeFile(join(tmp, '.esper', 'plans', 'archived', 'phase-1', '010-archived.md'), archivedPlan)
  try {
    const result = runCLI(['plan', 'list', '--dir', 'archived', '--format', 'json'], tmp)
    const plans = JSON.parse(result.stdout)
    assert.equal(plans.length, 1)
    assert.equal(plans[0].id, 10)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('plan get — returns frontmatter as JSON', async () => {
  const tmp = await setupPlansProject({
    pending: { '001-first.md': PLAN_A },
  })
  try {
    const result = runCLI(['plan', 'get', '001-first.md'], tmp)
    assert.equal(result.status, 0)
    const fm = JSON.parse(result.stdout)
    assert.equal(fm.id, 1)
    assert.equal(fm.title, 'First plan')
    assert.equal(fm.phase, 'phase-2')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('plan get — searches active before pending', async () => {
  const activeCopy = PLAN_A.replace('status: pending', 'status: active')
  const tmp = await setupPlansProject({
    active: { '001-first.md': activeCopy },
    pending: { '001-first.md': PLAN_A },
  })
  try {
    const result = runCLI(['plan', 'get', '001-first.md'], tmp)
    const fm = JSON.parse(result.stdout)
    assert.equal(fm.status, 'active')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('plan get — exits 1 for missing plan', async () => {
  const tmp = await setupPlansProject({})
  try {
    const result = runCLI(['plan', 'get', 'nonexistent.md'], tmp)
    assert.equal(result.status, 1)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('plan next-id — returns 001 with no plans', async () => {
  const tmp = await setupPlansProject({})
  try {
    const result = runCLI(['plan', 'next-id'], tmp)
    assert.equal(result.status, 0)
    assert.equal(result.stdout.trim(), '001')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('plan next-id — scans archived directories', async () => {
  const archivedPlan = `---
id: 010
title: Archived
status: done
phase: phase-1
---
`
  const tmp = await setupPlansProject({})
  await mkdir(join(tmp, '.esper', 'plans', 'archived', 'phase-1'), { recursive: true })
  await writeFile(join(tmp, '.esper', 'plans', 'archived', 'phase-1', '010-x.md'), archivedPlan)
  try {
    const result = runCLI(['plan', 'next-id'], tmp)
    assert.equal(result.stdout.trim(), '011')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('plan next-id — finds max across all directories', async () => {
  const tmp = await setupPlansProject({
    pending: { '001-first.md': PLAN_A },
    active: { '003-active.md': PLAN_C },
  })
  try {
    const result = runCLI(['plan', 'next-id'], tmp)
    assert.equal(result.stdout.trim(), '004')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})
