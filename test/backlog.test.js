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

async function setupBacklogProject(plans = {}) {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-backlog-test-'))
  await mkdir(join(tmp, '.esper'), { recursive: true })
  await writeFile(join(tmp, '.esper', 'esper.json'), JSON.stringify({
    backlog_mode: 'local',
    current_phase: 'phase-1',
    commands: { test: '', lint: '', typecheck: '', dev: '' }
  }, null, 2) + '\n')

  for (const dir of ['active', 'pending', 'done']) {
    await mkdir(join(tmp, '.esper', 'plans', dir), { recursive: true })
    if (plans[dir]) {
      for (const [filename, content] of Object.entries(plans[dir])) {
        await writeFile(join(tmp, '.esper', 'plans', dir, filename), content)
      }
    }
  }
  return tmp
}

test('backlog — empty backlog prints message', async () => {
  const tmp = await setupBacklogProject()
  try {
    const result = runCLI(['backlog'], tmp)
    assert.equal(result.status, 0)
    assert.ok(result.stdout.includes('Backlog is empty'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('backlog — shows active, pending, and done sections', async () => {
  const tmp = await setupBacklogProject({
    active: {
      '002-feature.md': '---\nid: 2\ntitle: Build feature X\nstatus: active\nphase: phase-1\nbranch: feature/phase-1\n---\n',
    },
    pending: {
      '003-another.md': '---\nid: 3\ntitle: Another feature\nstatus: pending\npriority: 2\nphase: phase-1\n---\n',
      '001-urgent.md': '---\nid: 1\ntitle: Urgent fix\nstatus: pending\npriority: 1\nphase: phase-1\n---\n',
    },
    done: {
      '000-setup.md': '---\nid: 0\ntitle: Initial setup\nstatus: done\nshipped_at: 2026-02-17\n---\n',
    },
  })
  try {
    const result = runCLI(['backlog'], tmp)
    assert.equal(result.status, 0)
    assert.ok(result.stdout.includes('ACTIVE'))
    assert.ok(result.stdout.includes('Build feature X'))
    assert.ok(result.stdout.includes('PENDING'))
    assert.ok(result.stdout.includes('Urgent fix'))
    assert.ok(result.stdout.includes('DONE (last 3)'))
    assert.ok(result.stdout.includes('Initial setup'))

    // Verify pending sort order: urgent (p1) before another (p2)
    const urgentIdx = result.stdout.indexOf('Urgent fix')
    const anotherIdx = result.stdout.indexOf('Another feature')
    assert.ok(urgentIdx < anotherIdx, 'p1 should appear before p2')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('backlog --format json — returns valid JSON', async () => {
  const tmp = await setupBacklogProject({
    pending: {
      '001-test.md': '---\nid: 1\ntitle: Test plan\nstatus: pending\npriority: 2\nphase: phase-1\n---\n',
    },
  })
  try {
    const result = runCLI(['backlog', '--format', 'json'], tmp)
    assert.equal(result.status, 0)
    const json = JSON.parse(result.stdout)
    assert.ok(Array.isArray(json.active))
    assert.ok(Array.isArray(json.pending))
    assert.ok(Array.isArray(json.done))
    assert.equal(json.pending.length, 1)
    assert.equal(json.pending[0].title, 'Test plan')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('backlog --format json — empty returns empty arrays', async () => {
  const tmp = await setupBacklogProject()
  try {
    const result = runCLI(['backlog', '--format', 'json'], tmp)
    assert.equal(result.status, 0)
    const json = JSON.parse(result.stdout)
    assert.deepEqual(json, { active: [], pending: [], done: [] })
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('backlog — done section shows only last 3', async () => {
  const tmp = await setupBacklogProject({
    done: {
      '001-a.md': '---\nid: 1\ntitle: Plan A\nstatus: done\nshipped_at: 2026-02-10\n---\n',
      '002-b.md': '---\nid: 2\ntitle: Plan B\nstatus: done\nshipped_at: 2026-02-11\n---\n',
      '003-c.md': '---\nid: 3\ntitle: Plan C\nstatus: done\nshipped_at: 2026-02-12\n---\n',
      '004-d.md': '---\nid: 4\ntitle: Plan D\nstatus: done\nshipped_at: 2026-02-13\n---\n',
    },
  })
  try {
    const result = runCLI(['backlog'], tmp)
    assert.equal(result.status, 0)
    // Should show D, C, B (most recent 3) but not A
    assert.ok(result.stdout.includes('Plan D'))
    assert.ok(result.stdout.includes('Plan C'))
    assert.ok(result.stdout.includes('Plan B'))
    assert.ok(!result.stdout.includes('Plan A'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})
