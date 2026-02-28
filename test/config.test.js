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

async function setupEsperProject(config) {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-config-test-'))
  await mkdir(join(tmp, '.esper'), { recursive: true })
  const esperConfig = config ?? {
    schema_version: 1,
    backlog_mode: 'local',
    spec_root: 'specs',
    commands: { test: '', lint: '', typecheck: '', dev: '' },
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
  }
  await writeFile(join(tmp, '.esper', 'esper.json'), JSON.stringify(esperConfig, null, 2) + '\n')
  await writeFile(join(tmp, '.esper', 'context.json'), JSON.stringify({
    schema_version: esperConfig.schema_version ?? 1,
    spec_root: esperConfig.spec_root ?? 'specs',
    constitution_path: null,
    active_increment: null,
    active_increment_scope: [],
    workflow_mode: esperConfig.workflow_defaults?.default_work_mode ?? 'atom',
    commands: esperConfig.commands ?? { test: '', lint: '', typecheck: '', dev: '' },
  }, null, 2) + '\n')
  return tmp
}

test('config check — exits 0 in esper project', async () => {
  const tmp = await setupEsperProject()
  try {
    const result = runCLI(['config', 'check'], tmp)
    assert.equal(result.status, 0)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('config check — exits 1 outside esper project', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-config-test-'))
  try {
    const result = runCLI(['config', 'check'], tmp)
    assert.equal(result.status, 1)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('config get — prints full JSON when no key given', async () => {
  const tmp = await setupEsperProject()
  try {
    const result = runCLI(['config', 'get'], tmp)
    assert.equal(result.status, 0)
    const json = JSON.parse(result.stdout)
    assert.equal(json.schema_version, 1)
    assert.equal(json.spec_root, 'specs')
    assert.equal(json.backlog_mode, 'local')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('config get — prints string value for a key', async () => {
  const tmp = await setupEsperProject()
  try {
    const result = runCLI(['config', 'get', 'spec_root'], tmp)
    assert.equal(result.status, 0)
    assert.equal(result.stdout.trim(), 'specs')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('config get — prints object value as JSON', async () => {
  const tmp = await setupEsperProject()
  try {
    const result = runCLI(['config', 'get', 'commands'], tmp)
    assert.equal(result.status, 0)
    const json = JSON.parse(result.stdout)
    assert.equal(json.test, '')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('config get — reads workflow_defaults', async () => {
  const tmp = await setupEsperProject()
  try {
    const result = runCLI(['config', 'get', 'workflow_defaults'], tmp)
    assert.equal(result.status, 0)
    const json = JSON.parse(result.stdout)
    assert.equal(json.commit_granularity, 'per-increment')
    assert.equal(json.default_work_mode, 'atom')
    assert.equal(json.auto_commit, false)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('config get — exits 1 for unknown key', async () => {
  const tmp = await setupEsperProject()
  try {
    const result = runCLI(['config', 'get', 'nonexistent'], tmp)
    assert.equal(result.status, 1)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('config set — updates a string value', async () => {
  const tmp = await setupEsperProject()
  try {
    const result = runCLI(['config', 'set', 'spec_root', 'docs/specs'], tmp)
    assert.equal(result.status, 0)
    assert.equal(result.stdout.trim(), 'docs/specs')

    const raw = await readFile(join(tmp, '.esper', 'esper.json'), 'utf8')
    const json = JSON.parse(raw)
    assert.equal(json.spec_root, 'docs/specs')

    const ctx = JSON.parse(await readFile(join(tmp, '.esper', 'context.json'), 'utf8'))
    assert.equal(ctx.spec_root, 'docs/specs')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('config set — parses JSON values', async () => {
  const tmp = await setupEsperProject()
  try {
    const result = runCLI(['config', 'set', 'commands', '{"test":"npm test","lint":""}'], tmp)
    assert.equal(result.status, 0)

    const raw = await readFile(join(tmp, '.esper', 'esper.json'), 'utf8')
    const json = JSON.parse(raw)
    assert.equal(json.commands.test, 'npm test')
    assert.equal(json.commands.lint, '')

    const ctx = JSON.parse(await readFile(join(tmp, '.esper', 'context.json'), 'utf8'))
    assert.equal(ctx.commands.test, 'npm test')
    assert.equal(ctx.commands.lint, '')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('config set — refreshes workflow mode in context.json', async () => {
  const tmp = await setupEsperProject()
  try {
    const result = runCLI([
      'config',
      'set',
      'workflow_defaults',
      '{"default_work_mode":"batch","commit_granularity":"per-increment"}',
    ], tmp)
    assert.equal(result.status, 0)

    const ctx = JSON.parse(await readFile(join(tmp, '.esper', 'context.json'), 'utf8'))
    assert.equal(ctx.workflow_mode, 'batch')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('install remains the default when no subcommand given', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-config-test-'))
  try {
    const result = spawnSync(process.execPath, [CLI], {
      env: { ...process.env, ESPER_SKILLS_DIR: tmp },
      encoding: 'utf8',
    })
    assert.equal(result.status, 0)
    assert.ok(result.stdout.includes('Installing esperkit skills'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})
