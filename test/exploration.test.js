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

async function setupExplorationsProject(explorations = {}) {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-exploration-test-'))
  await mkdir(join(tmp, '.esper'), { recursive: true })
  await writeFile(join(tmp, '.esper', 'esper.json'), JSON.stringify({
    backlog_mode: 'local',
    current_phase: '001-test-phase',
    commands: {}
  }, null, 2) + '\n')

  if (explorations.root) {
    await mkdir(join(tmp, '.esper', 'explorations'), { recursive: true })
    for (const [name, content] of Object.entries(explorations.root)) {
      await writeFile(join(tmp, '.esper', 'explorations', name), content)
    }
  }

  if (explorations.archived) {
    await mkdir(join(tmp, '.esper', 'explorations', 'archived'), { recursive: true })
    for (const [name, content] of Object.entries(explorations.archived)) {
      await writeFile(join(tmp, '.esper', 'explorations', 'archived', name), content)
    }
  }

  return tmp
}

const EXPLORATION_A = `---
id: 1
title: Add dark mode
created: 2026-02-20
mode: both
---

# Exploration: Add dark mode

## Question
Should we add dark mode support?
`

const EXPLORATION_B = `---
id: 2
title: Plugin system
created: 2026-02-21
mode: codebase
---

# Exploration: Plugin system

## Question
Is a plugin system feasible?
`

test('exploration list — shows explorations sorted by id', async () => {
  const tmp = await setupExplorationsProject({
    root: { '002-plugin.md': EXPLORATION_B, '001-dark-mode.md': EXPLORATION_A },
  })
  try {
    const result = runCLI(['exploration', 'list'], tmp)
    assert.equal(result.status, 0)
    const lines = result.stdout.trim().split('\n')
    assert.equal(lines.length, 2)
    assert.ok(lines[0].includes('#001'))
    assert.ok(lines[1].includes('#002'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('exploration list --format json — returns valid JSON', async () => {
  const tmp = await setupExplorationsProject({
    root: { '001-dark-mode.md': EXPLORATION_A },
  })
  try {
    const result = runCLI(['exploration', 'list', '--format', 'json'], tmp)
    assert.equal(result.status, 0)
    const explorations = JSON.parse(result.stdout)
    assert.equal(explorations.length, 1)
    assert.equal(explorations[0].id, 1)
    assert.equal(explorations[0].title, 'Add dark mode')
    assert.equal(explorations[0]._file, undefined, 'Internal fields should be stripped')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('exploration list — excludes archived explorations', async () => {
  const tmp = await setupExplorationsProject({
    root: { '001-dark-mode.md': EXPLORATION_A },
    archived: { '002-plugin.md': EXPLORATION_B },
  })
  try {
    const result = runCLI(['exploration', 'list', '--format', 'json'], tmp)
    const explorations = JSON.parse(result.stdout)
    assert.equal(explorations.length, 1)
    assert.equal(explorations[0].id, 1)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('exploration list — empty prints message', async () => {
  const tmp = await setupExplorationsProject({})
  try {
    const result = runCLI(['exploration', 'list'], tmp)
    assert.equal(result.status, 0)
    assert.ok(result.stdout.includes('No explorations found'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('exploration next-id — returns 001 with no explorations', async () => {
  const tmp = await setupExplorationsProject({})
  try {
    const result = runCLI(['exploration', 'next-id'], tmp)
    assert.equal(result.status, 0)
    assert.equal(result.stdout.trim(), '001')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('exploration next-id — scans archived explorations', async () => {
  const tmp = await setupExplorationsProject({
    archived: { '005-old.md': EXPLORATION_A.replace('id: 1', 'id: 5') },
  })
  try {
    const result = runCLI(['exploration', 'next-id'], tmp)
    assert.equal(result.stdout.trim(), '006')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('exploration next-id — finds max across root and archived', async () => {
  const tmp = await setupExplorationsProject({
    root: { '001-dark-mode.md': EXPLORATION_A },
    archived: { '002-plugin.md': EXPLORATION_B },
  })
  try {
    const result = runCLI(['exploration', 'next-id'], tmp)
    assert.equal(result.stdout.trim(), '003')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('exploration get — returns frontmatter as JSON', async () => {
  const tmp = await setupExplorationsProject({
    root: { '001-dark-mode.md': EXPLORATION_A },
  })
  try {
    const result = runCLI(['exploration', 'get', '001-dark-mode.md'], tmp)
    assert.equal(result.status, 0)
    const fm = JSON.parse(result.stdout)
    assert.equal(fm.id, 1)
    assert.equal(fm.title, 'Add dark mode')
    assert.equal(fm.mode, 'both')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('exploration get — exits 1 for missing exploration', async () => {
  const tmp = await setupExplorationsProject({})
  try {
    const result = runCLI(['exploration', 'get', 'nonexistent.md'], tmp)
    assert.equal(result.status, 1)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('exploration archive — moves file to archived/', async () => {
  const tmp = await setupExplorationsProject({
    root: { '001-dark-mode.md': EXPLORATION_A },
  })
  try {
    const result = runCLI(['exploration', 'archive', '001-dark-mode.md'], tmp)
    assert.equal(result.status, 0)
    assert.ok(result.stdout.includes('Add dark mode'))

    // File should be in archived/ now
    assert.ok(existsSync(join(tmp, '.esper', 'explorations', 'archived', '001-dark-mode.md')))
    // File should not be in root anymore
    assert.ok(!existsSync(join(tmp, '.esper', 'explorations', '001-dark-mode.md')))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('exploration archive — exits 1 for missing exploration', async () => {
  const tmp = await setupExplorationsProject({})
  try {
    const result = runCLI(['exploration', 'archive', 'nonexistent.md'], tmp)
    assert.equal(result.status, 1)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})
