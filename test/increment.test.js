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

async function setupProject(increments = {}) {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-inc-test-'))
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

const INC_A = `---
id: 1
title: First increment
status: pending
type: feature
lane: atomic
parent: null
depends_on: null
priority: 2
created: 2026-02-28
spec: null
spec_section: null
---

# First increment
`

const INC_B = `---
id: 2
title: Second increment
status: pending
type: fix
lane: atomic
parent: null
depends_on: null
priority: 1
created: 2026-02-28
spec: null
spec_section: null
---

# Second increment
`

const INC_C = `---
id: 3
title: Active increment
status: active
type: feature
lane: systematic
parent: null
depends_on: null
priority: 1
created: 2026-02-28
spec: product/behavior.md
spec_section: null
---

# Active increment
`

test('increment list — shows increments sorted by priority then id', async () => {
  const tmp = await setupProject({
    pending: { '001-first.md': INC_A, '002-second.md': INC_B },
    active: { '003-active.md': INC_C },
  })
  try {
    const result = runCLI(['increment', 'list'], tmp)
    assert.equal(result.status, 0)
    const lines = result.stdout.trim().split('\n')
    assert.ok(lines[0].includes('#002'))
    assert.ok(lines[1].includes('#003'))
    assert.ok(lines[2].includes('#001'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('increment list --format json — returns valid JSON', async () => {
  const tmp = await setupProject({
    pending: { '001-first.md': INC_A },
  })
  try {
    const result = runCLI(['increment', 'list', '--format', 'json'], tmp)
    assert.equal(result.status, 0)
    const incs = JSON.parse(result.stdout)
    assert.equal(incs.length, 1)
    assert.equal(incs[0].id, 1)
    assert.equal(incs[0].title, 'First increment')
    assert.equal(incs[0]._file, undefined)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('increment list --lane — filters by lane', async () => {
  const tmp = await setupProject({
    pending: { '001-first.md': INC_A },
    active: { '003-active.md': INC_C },
  })
  try {
    const result = runCLI(['increment', 'list', '--lane', 'systematic', '--format', 'json'], tmp)
    const incs = JSON.parse(result.stdout)
    assert.equal(incs.length, 1)
    assert.equal(incs[0].lane, 'systematic')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('increment list — empty prints message', async () => {
  const tmp = await setupProject({})
  try {
    const result = runCLI(['increment', 'list'], tmp)
    assert.equal(result.status, 0)
    assert.ok(result.stdout.includes('No increments found'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('increment get — returns frontmatter as JSON', async () => {
  const tmp = await setupProject({
    pending: { '001-first.md': INC_A },
  })
  try {
    const result = runCLI(['increment', 'get', '001-first.md'], tmp)
    assert.equal(result.status, 0)
    const fm = JSON.parse(result.stdout)
    assert.equal(fm.id, 1)
    assert.equal(fm.title, 'First increment')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('increment get — exits 1 for missing increment', async () => {
  const tmp = await setupProject({})
  try {
    const result = runCLI(['increment', 'get', 'nonexistent.md'], tmp)
    assert.equal(result.status, 1)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('increment next-id — returns 001 with no increments', async () => {
  const tmp = await setupProject({})
  try {
    const result = runCLI(['increment', 'next-id'], tmp)
    assert.equal(result.status, 0)
    assert.equal(result.stdout.trim(), '001')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('increment next-id — scans archived', async () => {
  const archivedInc = `---\nid: 10\ntitle: Archived\nstatus: done\n---\n`
  const tmp = await setupProject({})
  await mkdir(join(tmp, '.esper', 'increments', 'archived'), { recursive: true })
  await writeFile(join(tmp, '.esper', 'increments', 'archived', '010-archived.md'), archivedInc)
  try {
    const result = runCLI(['increment', 'next-id'], tmp)
    assert.equal(result.stdout.trim(), '011')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('increment create — creates file in pending', async () => {
  const tmp = await setupProject({})
  await mkdir(join(tmp, '.esper', 'increments', 'pending'), { recursive: true })
  try {
    const result = runCLI(['increment', 'create', '--title', 'Test feature', '--lane', 'atomic', '--type', 'feature'], tmp)
    assert.equal(result.status, 0)
    const filename = result.stdout.trim()
    assert.ok(filename.includes('001'))
    assert.ok(existsSync(join(tmp, '.esper', 'increments', 'pending', filename)))
    const content = await readFile(join(tmp, '.esper', 'increments', 'pending', filename), 'utf8')
    assert.ok(content.includes('title: Test feature'))
    assert.ok(content.includes('lane: atomic'))
    assert.ok(content.includes('status: pending'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('increment next-id — finds max across all directories', async () => {
  const tmp = await setupProject({
    pending: { '001-first.md': INC_A },
    active: { '003-active.md': INC_C },
  })
  try {
    const result = runCLI(['increment', 'next-id'], tmp)
    assert.equal(result.stdout.trim(), '004')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})
