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

const INC_PENDING = `---
id: 1
title: Test increment
status: pending
type: feature
lane: atomic
parent: null
depends_on: null
priority: 2
created: 2026-02-28
spec: product/behavior.md
spec_section: null
---

# Test increment
`

const INC_ACTIVE = `---
id: 2
title: Active increment
status: active
type: feature
lane: atomic
parent: null
depends_on: null
priority: 1
created: 2026-02-28
spec: null
spec_section: null
---

# Active increment
`

const INC_DONE = `---
id: 3
title: Done increment
status: done
type: feature
lane: atomic
parent: null
depends_on: null
priority: 1
created: 2026-02-28
finished_at: 2026-02-28
spec: null
spec_section: null
---

# Done increment
`

async function setupProject(increments = {}) {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-mut-test-'))
  await mkdir(join(tmp, '.esper'), { recursive: true })
  await writeFile(join(tmp, '.esper', 'esper.json'), JSON.stringify({
    schema_version: 1,
    spec_root: 'specs',
    commands: {},
    workflow_defaults: {},
  }, null, 2) + '\n')
  await writeFile(join(tmp, '.esper', 'context.json'), JSON.stringify({
    schema_version: 1,
    spec_root: 'specs',
    active_increment: null,
    active_increment_scope: [],
    workflow_mode: 'atom',
    commands: {},
  }, null, 2) + '\n')

  for (const [dir, files] of Object.entries(increments)) {
    await mkdir(join(tmp, '.esper', 'increments', dir), { recursive: true })
    for (const [name, content] of Object.entries(files)) {
      await writeFile(join(tmp, '.esper', 'increments', dir, name), content)
    }
  }
  return tmp
}

// --- activate ---

test('increment activate — moves pending to active with status update', async () => {
  const tmp = await setupProject({ pending: { '001-test.md': INC_PENDING } })
  try {
    const result = runCLI(['increment', 'activate', '001-test.md'], tmp)
    assert.equal(result.status, 0)
    assert.ok(result.stdout.includes('Test increment'))
    assert.ok(!existsSync(join(tmp, '.esper', 'increments', 'pending', '001-test.md')))
    assert.ok(existsSync(join(tmp, '.esper', 'increments', 'active', '001-test.md')))

    const content = await readFile(join(tmp, '.esper', 'increments', 'active', '001-test.md'), 'utf8')
    assert.ok(content.includes('status: active'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('increment activate — updates context.json', async () => {
  const tmp = await setupProject({ pending: { '001-test.md': INC_PENDING } })
  try {
    runCLI(['increment', 'activate', '001-test.md'], tmp)
    const ctx = JSON.parse(await readFile(join(tmp, '.esper', 'context.json'), 'utf8'))
    assert.equal(ctx.active_increment, '001-test.md')
    assert.deepEqual(ctx.active_increment_scope, ['product/behavior.md'])
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('increment activate — exits 1 when not in pending', async () => {
  const tmp = await setupProject({})
  try {
    const result = runCLI(['increment', 'activate', 'nonexistent.md'], tmp)
    assert.equal(result.status, 1)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

// --- finish ---

test('increment finish — moves active to done with status and finished_at', async () => {
  const tmp = await setupProject({ active: { '002-active.md': INC_ACTIVE } })
  try {
    const result = runCLI(['increment', 'finish', '002-active.md'], tmp)
    assert.equal(result.status, 0)
    assert.ok(!existsSync(join(tmp, '.esper', 'increments', 'active', '002-active.md')))
    assert.ok(existsSync(join(tmp, '.esper', 'increments', 'done', '002-active.md')))

    const content = await readFile(join(tmp, '.esper', 'increments', 'done', '002-active.md'), 'utf8')
    assert.ok(content.includes('status: done'))
    assert.ok(content.includes('finished_at:'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('increment finish — clears context.json active increment', async () => {
  const tmp = await setupProject({ active: { '002-active.md': INC_ACTIVE } })
  // Set active increment in context first
  await writeFile(join(tmp, '.esper', 'context.json'), JSON.stringify({
    schema_version: 1,
    active_increment: '002-active.md',
    active_increment_scope: [],
  }, null, 2) + '\n')
  try {
    runCLI(['increment', 'finish', '002-active.md'], tmp)
    const ctx = JSON.parse(await readFile(join(tmp, '.esper', 'context.json'), 'utf8'))
    assert.equal(ctx.active_increment, null)
    assert.deepEqual(ctx.active_increment_scope, [])
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('increment finish — exits 1 when not in active', async () => {
  const tmp = await setupProject({})
  try {
    const result = runCLI(['increment', 'finish', 'nonexistent.md'], tmp)
    assert.equal(result.status, 1)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

// --- archive ---

test('increment archive — moves done to archived', async () => {
  const tmp = await setupProject({ done: { '003-done.md': INC_DONE } })
  try {
    const result = runCLI(['increment', 'archive', '003-done.md'], tmp)
    assert.equal(result.status, 0)
    assert.ok(!existsSync(join(tmp, '.esper', 'increments', 'done', '003-done.md')))
    assert.ok(existsSync(join(tmp, '.esper', 'increments', 'archived', '003-done.md')))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

// --- set ---

test('increment set — updates frontmatter field', async () => {
  const tmp = await setupProject({ pending: { '001-test.md': INC_PENDING } })
  try {
    const result = runCLI(['increment', 'set', '001-test.md', 'priority', '1'], tmp)
    assert.equal(result.status, 0)
    assert.equal(result.stdout.trim(), '1')

    const content = await readFile(join(tmp, '.esper', 'increments', 'pending', '001-test.md'), 'utf8')
    assert.ok(content.includes('priority: 1'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('increment set — exits 1 for missing increment', async () => {
  const tmp = await setupProject({})
  try {
    const result = runCLI(['increment', 'set', 'nonexistent.md', 'priority', '1'], tmp)
    assert.equal(result.status, 1)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

// --- group ---

test('increment group — creates a parent wrapper and activates the first child', async () => {
  const tmp = await setupProject({})
  await mkdir(join(tmp, '.esper', 'increments', 'active'), { recursive: true })
  await mkdir(join(tmp, '.esper', 'increments', 'pending'), { recursive: true })
  try {
    const children = JSON.stringify([
      { title: 'Child A', type: 'feature' },
      { title: 'Child B', type: 'fix' },
    ])
    const result = runCLI(['increment', 'group', '--title', 'Batch work', '--children', children], tmp)
    assert.equal(result.status, 0)
    const parentFilename = result.stdout.trim()
    assert.ok(existsSync(join(tmp, '.esper', 'increments', 'active', parentFilename)))
    assert.ok(existsSync(join(tmp, '.esper', 'increments', 'active', '002-child-a.md')))

    // Check parent content
    const parentContent = await readFile(join(tmp, '.esper', 'increments', 'active', parentFilename), 'utf8')
    assert.ok(parentContent.includes('type: batch'))
    assert.ok(parentContent.includes('lane: systematic'))
    assert.ok(parentContent.includes('Child A'))
    assert.ok(parentContent.includes('Child B'))

    const firstChildContent = await readFile(join(tmp, '.esper', 'increments', 'active', '002-child-a.md'), 'utf8')
    assert.ok(firstChildContent.includes('status: active'))
    assert.ok(firstChildContent.includes('## Scope'))

    // Check only remaining children stay in pending
    const { readdir } = await import('node:fs/promises')
    const pending = (await readdir(join(tmp, '.esper', 'increments', 'pending'))).sort()
    assert.deepEqual(pending, ['003-child-b.md'])

    const ctx = JSON.parse(await readFile(join(tmp, '.esper', 'context.json'), 'utf8'))
    assert.equal(ctx.active_increment, '002-child-a.md')
    assert.deepEqual(ctx.active_increment_scope, [])
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('increment finish — advances to the next batch child', async () => {
  const tmp = await setupProject({})
  await mkdir(join(tmp, '.esper', 'increments', 'active'), { recursive: true })
  await mkdir(join(tmp, '.esper', 'increments', 'pending'), { recursive: true })
  try {
    const children = JSON.stringify([
      { title: 'Child A', type: 'feature', spec: 'product/alpha.md' },
      { title: 'Child B', type: 'fix', spec: 'product/beta.md' },
    ])
    const grouped = runCLI(['increment', 'group', '--title', 'Batch work', '--children', children], tmp)
    assert.equal(grouped.status, 0)

    const finished = runCLI(['increment', 'finish', '002-child-a.md'], tmp)
    assert.equal(finished.status, 0)
    assert.ok(existsSync(join(tmp, '.esper', 'increments', 'done', '002-child-a.md')))
    assert.ok(existsSync(join(tmp, '.esper', 'increments', 'active', '003-child-b.md')))
    assert.ok(!existsSync(join(tmp, '.esper', 'increments', 'pending', '003-child-b.md')))

    const nextChildContent = await readFile(join(tmp, '.esper', 'increments', 'active', '003-child-b.md'), 'utf8')
    assert.ok(nextChildContent.includes('status: active'))

    const ctx = JSON.parse(await readFile(join(tmp, '.esper', 'context.json'), 'utf8'))
    assert.equal(ctx.active_increment, '003-child-b.md')
    assert.deepEqual(ctx.active_increment_scope, ['product/beta.md'])
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})
