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

async function setupProject() {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-spec-test-'))
  await mkdir(join(tmp, '.esper'), { recursive: true })
  await writeFile(join(tmp, '.esper', 'esper.json'), JSON.stringify({
    schema_version: 1,
    spec_root: 'specs',
    commands: { test: '', lint: '', typecheck: '', dev: '' },
    workflow_defaults: {},
  }, null, 2) + '\n')
  await writeFile(join(tmp, '.esper', 'context.json'), JSON.stringify({
    schema_version: 1,
    spec_root: 'specs',
    constitution_path: null,
    active_increment: null,
    active_increment_scope: [],
    workflow_mode: 'atom',
    commands: { test: '', lint: '', typecheck: '', dev: '' },
  }, null, 2) + '\n')
  // Create spec tree
  for (const d of ['system', 'product', 'interfaces', '_work']) {
    await mkdir(join(tmp, 'specs', d), { recursive: true })
  }
  await writeFile(join(tmp, 'specs', 'index.md'), '# Spec Index\n\n## System\n- system/\n\n## Product\n- product/\n\n## Interfaces\n- interfaces/\n')
  await writeFile(join(tmp, 'specs', 'system', 'architecture.md'), '---\nstatus: draft\ncreated: 2026-02-28\n---\n\n# architecture\n\n## Overview\n')
  return tmp
}

test('spec index — prints index.md content', async () => {
  const tmp = await setupProject()
  try {
    const result = runCLI(['spec', 'index'], tmp)
    assert.equal(result.status, 0)
    assert.ok(result.stdout.includes('Spec Index'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('spec index — exits 1 when no spec tree exists', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-spec-test-'))
  await mkdir(join(tmp, '.esper'), { recursive: true })
  await writeFile(join(tmp, '.esper', 'esper.json'), JSON.stringify({ spec_root: 'specs' }, null, 2) + '\n')
  try {
    const result = runCLI(['spec', 'index'], tmp)
    assert.equal(result.status, 1)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('spec get — prints file content', async () => {
  const tmp = await setupProject()
  try {
    const result = runCLI(['spec', 'get', 'system/architecture.md'], tmp)
    assert.equal(result.status, 0)
    assert.ok(result.stdout.includes('architecture'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('spec get — exits 1 for missing file', async () => {
  const tmp = await setupProject()
  try {
    const result = runCLI(['spec', 'get', 'nonexistent.md'], tmp)
    assert.equal(result.status, 1)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('spec create — creates file with frontmatter', async () => {
  const tmp = await setupProject()
  try {
    const result = runCLI(['spec', 'create', 'product/new-feature.md'], tmp)
    assert.equal(result.status, 0)
    assert.ok(result.stdout.includes('product/new-feature.md'))
    const content = await readFile(join(tmp, 'specs', 'product', 'new-feature.md'), 'utf8')
    assert.ok(content.includes('status: draft'))
    assert.ok(content.includes('# new-feature'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('spec create — is non-destructive', async () => {
  const tmp = await setupProject()
  try {
    runCLI(['spec', 'create', 'product/test.md'], tmp)
    const result = runCLI(['spec', 'create', 'product/test.md'], tmp)
    assert.equal(result.status, 0)
    assert.ok(result.stdout.includes('already exists'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('spec set-root — updates esper.json', async () => {
  const tmp = await setupProject()
  try {
    const result = runCLI(['spec', 'set-root', 'custom-specs'], tmp)
    assert.equal(result.status, 0)
    assert.ok(result.stdout.includes('custom-specs'))
    const raw = await readFile(join(tmp, '.esper', 'esper.json'), 'utf8')
    const json = JSON.parse(raw)
    assert.equal(json.spec_root, 'custom-specs')

    const ctx = JSON.parse(await readFile(join(tmp, '.esper', 'context.json'), 'utf8'))
    assert.equal(ctx.spec_root, 'custom-specs')

    assert.ok(existsSync(join(tmp, 'custom-specs', 'index.md')))
    assert.ok(existsSync(join(tmp, 'custom-specs', 'system')))
    assert.ok(existsSync(join(tmp, 'custom-specs', 'product')))
    assert.ok(existsSync(join(tmp, 'custom-specs', 'interfaces')))
    assert.ok(existsSync(join(tmp, 'custom-specs', '_work')))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('spec archive — moves file and preserves relative path', async () => {
  const tmp = await setupProject()
  await writeFile(join(tmp, 'specs', 'product', 'architecture.md'), '---\nstatus: draft\ncreated: 2026-02-28\n---\n\n# architecture\n')
  try {
    const result = runCLI(['spec', 'archive', 'system/architecture.md'], tmp)
    assert.equal(result.status, 0)
    assert.ok(!existsSync(join(tmp, 'specs', 'system', 'architecture.md')))
    assert.ok(existsSync(join(tmp, 'specs', '_archived', 'system', 'architecture.md')))
    assert.ok(existsSync(join(tmp, 'specs', 'product', 'architecture.md')))
    const content = await readFile(join(tmp, 'specs', '_archived', 'system', 'architecture.md'), 'utf8')
    assert.ok(content.includes('status: archived'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})
