import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CLI = join(__dirname, '..', 'bin', 'cli.js')
const CONTEXT_MODULE = pathToFileURL(join(__dirname, '..', 'lib', 'context.js')).href

function runCLI(args, cwd) {
  return spawnSync(process.execPath, [CLI, ...args], {
    cwd,
    encoding: 'utf8',
  })
}

async function setupProject() {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-context-test-'))
  await mkdir(join(tmp, '.esper'), { recursive: true })
  await writeFile(join(tmp, '.esper', 'esper.json'), JSON.stringify({
    schema_version: 1,
    spec_root: 'specs',
    commands: { test: 'npm test', lint: '', typecheck: '', dev: '' },
    workflow_defaults: {
      commit_granularity: 'per-increment',
      auto_commit: false,
      pr_policy: 'explicit-only',
      pr_grouping: 'per-increment',
      validation_mode: 'blocking',
      spec_sync_mode: 'proactive',
      default_work_mode: 'atom',
      auto_review_before_sync: false,
      increment_retention_policy: 'keep',
    },
  }, null, 2) + '\n')
  await writeFile(join(tmp, '.esper', 'context.json'), JSON.stringify({
    schema_version: 1,
    spec_root: 'specs',
    constitution_path: null,
    active_increment: null,
    active_increment_scope: [],
    workflow_mode: 'atom',
    commands: { test: 'npm test', lint: '', typecheck: '', dev: '' },
  }, null, 2) + '\n')
  return tmp
}

test('context get — prints valid JSON with expected keys', async () => {
  const tmp = await setupProject()
  try {
    const result = runCLI(['context', 'get'], tmp)
    assert.equal(result.status, 0)
    const ctx = JSON.parse(result.stdout)
    assert.equal(ctx.schema_version, 1)
    assert.equal(ctx.spec_root, 'specs')
    assert.equal(ctx.active_increment, null)
    assert.equal(ctx.workflow_mode, 'atom')
    assert.ok(Array.isArray(ctx.active_increment_scope))
    assert.ok(ctx.commands)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('context get — exits 1 if no project initialized', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-context-test-'))
  try {
    const result = runCLI(['context', 'get'], tmp)
    assert.equal(result.status, 1)
    assert.ok(result.stderr.includes('No context.json'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('context get — includes spec_root and commands from config', async () => {
  const tmp = await setupProject()
  try {
    const result = runCLI(['context', 'get'], tmp)
    const ctx = JSON.parse(result.stdout)
    assert.equal(ctx.spec_root, 'specs')
    assert.equal(ctx.commands.test, 'npm test')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('context build — prefers an active child over a batch wrapper', async () => {
  const tmp = await setupProject()
  await mkdir(join(tmp, '.esper', 'increments', 'active'), { recursive: true })
  await writeFile(join(tmp, '.esper', 'increments', 'active', '001-batch-work.md'), `---
id: 1
title: Batch work
status: active
type: batch
lane: systematic
parent: null
depends_on: null
priority: 1
created: 2026-02-28
spec: null
spec_section: null
---

# Batch work

## Queue
- 002: Child work
`)
  await writeFile(join(tmp, '.esper', 'increments', 'active', '002-child-work.md'), `---
id: 2
title: Child work
status: active
type: feature
lane: atomic
parent: 1
depends_on: null
priority: 1
created: 2026-02-28
spec: product/behavior.md
spec_section: null
---

# Child work
`)
  try {
    const result = spawnSync(process.execPath, [
      '--input-type=module',
      '-e',
      `import { build } from ${JSON.stringify(CONTEXT_MODULE)}; const ctx = await build(); console.log(JSON.stringify(ctx));`,
    ], {
      cwd: tmp,
      encoding: 'utf8',
    })
    assert.equal(result.status, 0)

    const ctx = JSON.parse(result.stdout)
    assert.equal(ctx.active_increment, '002-child-work.md')
    assert.deepEqual(ctx.active_increment_scope, ['product/behavior.md'])
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})
