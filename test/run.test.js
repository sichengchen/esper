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

async function setupProject() {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-run-test-'))
  await mkdir(join(tmp, '.esper', 'increments', 'active'), { recursive: true })
  await mkdir(join(tmp, '.esper', 'runs'), { recursive: true })
  await writeFile(join(tmp, '.esper', 'esper.json'), JSON.stringify({
    schema_version: 2,
    spec_root: 'specs',
    commands: { test: 'npm test' },
    workflow_defaults: {},
  }, null, 2) + '\n')
  await writeFile(join(tmp, '.esper', 'context.json'), JSON.stringify({
    schema_version: 2,
    spec_root: 'specs',
    constitution_path: null,
    active_increment: '001-test-work.md',
    active_increment_scope: [],
    active_run: null,
    active_execution_mode: 'interactive',
    workflow_mode: 'atom',
    commands: { test: 'npm test' },
  }, null, 2) + '\n')
  // Create an active increment
  await writeFile(join(tmp, '.esper', 'increments', 'active', '001-test-work.md'), `---
id: 1
title: Test work
status: active
type: feature
lane: atomic
execution_mode: autonomous
priority: 1
created: 2026-03-01
spec: specs/test.md
spec_section: null
---
# Test work
`)
  return tmp
}

test('run create — creates run directory and run.json', async () => {
  const tmp = await setupProject()
  try {
    const result = runCLI(['run', 'create', '001-test-work.md'], tmp)
    assert.equal(result.status, 0, `Failed:\n${result.stderr}`)
    const runId = result.stdout.trim()
    assert.ok(runId.length > 0)

    // Check directory structure
    assert.ok(existsSync(join(tmp, '.esper', 'runs', runId, 'run.json')))
    assert.ok(existsSync(join(tmp, '.esper', 'runs', runId, 'tasks')))
    assert.ok(existsSync(join(tmp, '.esper', 'runs', runId, 'reviews')))

    // Check run.json content
    const runData = JSON.parse(await readFile(join(tmp, '.esper', 'runs', runId, 'run.json'), 'utf8'))
    assert.equal(runData.id, runId)
    assert.equal(runData.increment, '001-test-work.md')
    assert.equal(runData.increment_id, 1)
    assert.equal(runData.spec_snapshot, 'specs/test.md')
    assert.equal(runData.status, 'executing')
    assert.ok(runData.created)

    // Check context updated
    const ctx = JSON.parse(await readFile(join(tmp, '.esper', 'context.json'), 'utf8'))
    assert.equal(ctx.active_run, runId)
    assert.equal(ctx.active_execution_mode, 'autonomous')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('run create — reads stop_conditions from autonomous_run_policy', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-run-test-'))
  await mkdir(join(tmp, '.esper', 'increments', 'active'), { recursive: true })
  await mkdir(join(tmp, '.esper', 'runs'), { recursive: true })
  await writeFile(join(tmp, '.esper', 'esper.json'), JSON.stringify({
    schema_version: 2,
    spec_root: 'specs',
    commands: { test: 'npm test' },
    workflow_defaults: {},
    autonomous_run_policy: {
      enabled: true,
      max_review_rounds: 5,
      max_runtime_minutes: 120,
      max_cost: 50,
      require_distinct_reviewer: true,
      allow_parallel_tasks: true,
    },
  }, null, 2) + '\n')
  await writeFile(join(tmp, '.esper', 'context.json'), JSON.stringify({
    schema_version: 2,
    spec_root: 'specs',
    active_increment: '001-test-work.md',
    active_increment_scope: [],
    active_run: null,
    active_execution_mode: 'interactive',
    workflow_mode: 'atom',
    commands: { test: 'npm test' },
  }, null, 2) + '\n')
  await writeFile(join(tmp, '.esper', 'increments', 'active', '001-test-work.md'), `---
id: 1
title: Test work
status: active
type: feature
lane: atomic
execution_mode: autonomous
spec: specs/test.md
---
# Test work
`)
  try {
    const result = runCLI(['run', 'create', '001-test-work.md'], tmp)
    assert.equal(result.status, 0, `Failed:\n${result.stderr}`)
    const runId = result.stdout.trim()

    const runData = JSON.parse(await readFile(join(tmp, '.esper', 'runs', runId, 'run.json'), 'utf8'))
    assert.equal(runData.stop_conditions.max_review_rounds, 5)
    assert.equal(runData.stop_conditions.max_runtime_minutes, 120)
    assert.equal(runData.stop_conditions.max_cost, 50)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('run create — exits 1 for missing increment', async () => {
  const tmp = await setupProject()
  try {
    const result = runCLI(['run', 'create', 'nonexistent.md'], tmp)
    assert.equal(result.status, 1)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('run get — returns run.json', async () => {
  const tmp = await setupProject()
  try {
    const createResult = runCLI(['run', 'create', '001-test-work.md'], tmp)
    const runId = createResult.stdout.trim()

    const result = runCLI(['run', 'get', runId], tmp)
    assert.equal(result.status, 0)
    const data = JSON.parse(result.stdout)
    assert.equal(data.id, runId)
    assert.equal(data.status, 'executing')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('run get — exits 1 for missing run', async () => {
  const tmp = await setupProject()
  try {
    const result = runCLI(['run', 'get', 'nonexistent'], tmp)
    assert.equal(result.status, 1)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('run list — shows runs as JSON', async () => {
  const tmp = await setupProject()
  try {
    const createResult = runCLI(['run', 'create', '001-test-work.md'], tmp)
    const runId = createResult.stdout.trim()

    const result = runCLI(['run', 'list'], tmp)
    assert.equal(result.status, 0)
    const runs = JSON.parse(result.stdout)
    assert.equal(runs.length, 1)
    assert.equal(runs[0].id, runId)
    assert.equal(runs[0].status, 'executing')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('run list — prints message when no runs', async () => {
  const tmp = await setupProject()
  try {
    const result = runCLI(['run', 'list'], tmp)
    assert.equal(result.status, 0)
    assert.ok(result.stdout.includes('No runs found'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('run stop — cancels run and updates context', async () => {
  const tmp = await setupProject()
  try {
    const createResult = runCLI(['run', 'create', '001-test-work.md'], tmp)
    const runId = createResult.stdout.trim()

    const result = runCLI(['run', 'stop', runId, 'Test stop reason'], tmp)
    assert.equal(result.status, 0)
    assert.ok(result.stdout.includes('stopped'))

    // Check run status
    const runData = JSON.parse(await readFile(join(tmp, '.esper', 'runs', runId, 'run.json'), 'utf8'))
    assert.equal(runData.status, 'cancelled')
    assert.equal(runData.stop_reason, 'Test stop reason')

    // Context should no longer have active run
    const ctx = JSON.parse(await readFile(join(tmp, '.esper', 'context.json'), 'utf8'))
    assert.equal(ctx.active_run, null)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('run add-task — creates task packet', async () => {
  const tmp = await setupProject()
  try {
    const createResult = runCLI(['run', 'create', '001-test-work.md'], tmp)
    const runId = createResult.stdout.trim()

    const taskJson = JSON.stringify({
      spec: 'specs/test.md',
      spec_section: 'Feature A',
      files_allowed: ['lib/feature.js'],
      verification: 'npm test',
      acceptance_criteria: 'Tests pass',
      assigned_role: 'implementer',
    })
    const result = runCLI(['run', 'add-task', runId, taskJson], tmp)
    assert.equal(result.status, 0, `Failed:\n${result.stderr}`)
    const taskId = result.stdout.trim()
    assert.ok(taskId.startsWith('task-'))

    // Check task file exists
    assert.ok(existsSync(join(tmp, '.esper', 'runs', runId, 'tasks', `${taskId}.json`)))

    const taskData = JSON.parse(await readFile(join(tmp, '.esper', 'runs', runId, 'tasks', `${taskId}.json`), 'utf8'))
    assert.equal(taskData.id, taskId)
    assert.equal(taskData.status, 'pending')
    assert.equal(taskData.assigned_role, 'implementer')
    assert.equal(taskData.spec, 'specs/test.md')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('run list-tasks — lists tasks in a run', async () => {
  const tmp = await setupProject()
  try {
    const createResult = runCLI(['run', 'create', '001-test-work.md'], tmp)
    const runId = createResult.stdout.trim()

    runCLI(['run', 'add-task', runId, JSON.stringify({ assigned_role: 'implementer' })], tmp)
    runCLI(['run', 'add-task', runId, JSON.stringify({ assigned_role: 'implementer' })], tmp)

    const result = runCLI(['run', 'list-tasks', runId], tmp)
    assert.equal(result.status, 0)
    const tasks = JSON.parse(result.stdout)
    assert.equal(tasks.length, 2)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('run add-review — creates review record', async () => {
  const tmp = await setupProject()
  try {
    const createResult = runCLI(['run', 'create', '001-test-work.md'], tmp)
    const runId = createResult.stdout.trim()

    const reviewJson = JSON.stringify({
      round: 1,
      candidate_commit: 'abc123',
      findings: ['Issue A', 'Issue B'],
      repair_tasks: [],
      result: 'failed',
    })
    const result = runCLI(['run', 'add-review', runId, reviewJson], tmp)
    assert.equal(result.status, 0, `Failed:\n${result.stderr}`)
    const reviewId = result.stdout.trim()
    assert.ok(reviewId.startsWith('review-'))

    assert.ok(existsSync(join(tmp, '.esper', 'runs', runId, 'reviews', `${reviewId}.json`)))

    const reviewData = JSON.parse(await readFile(join(tmp, '.esper', 'runs', runId, 'reviews', `${reviewId}.json`), 'utf8'))
    assert.equal(reviewData.round, 1)
    assert.equal(reviewData.result, 'failed')
    assert.equal(reviewData.run_id, runId)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('run list-reviews — lists reviews in a run', async () => {
  const tmp = await setupProject()
  try {
    const createResult = runCLI(['run', 'create', '001-test-work.md'], tmp)
    const runId = createResult.stdout.trim()

    runCLI(['run', 'add-review', runId, JSON.stringify({ round: 1, result: 'failed' })], tmp)
    runCLI(['run', 'add-review', runId, JSON.stringify({ round: 2, result: 'passed' })], tmp)

    const result = runCLI(['run', 'list-reviews', runId], tmp)
    assert.equal(result.status, 0)
    const reviews = JSON.parse(result.stdout)
    assert.equal(reviews.length, 2)
    assert.equal(reviews[0].round, 1)
    assert.equal(reviews[1].round, 2)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})
