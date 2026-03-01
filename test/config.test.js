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
    schema_version: 2,
    backlog_mode: 'local',
    spec_root: 'specs',
    commands: { test: '', lint: '', typecheck: '', dev: '' },
    workflow_defaults: {
      planning: 'Default to atom.',
      commits: 'One commit per increment.',
      pull_requests: 'One PR per increment.',
      validation: 'Run tests before marking complete.',
      spec_sync: 'Sync specs proactively.',
      review: 'Review before sync.',
      retention: 'Keep in done.',
    },
  }
  await writeFile(join(tmp, '.esper', 'esper.json'), JSON.stringify(esperConfig, null, 2) + '\n')
  await writeFile(join(tmp, '.esper', 'context.json'), JSON.stringify({
    schema_version: esperConfig.schema_version ?? 2,
    spec_root: esperConfig.spec_root ?? 'specs',
    constitution_path: null,
    active_increment: null,
    active_increment_scope: [],
    workflow_mode: 'atom',
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
    assert.equal(json.schema_version, 2)
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
    assert.equal(json.planning, 'Default to atom.')
    assert.equal(json.commits, 'One commit per increment.')
    assert.equal(json.review, 'Review before sync.')
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

test('config set — supports dot-notation for nested keys', async () => {
  const tmp = await setupEsperProject()
  try {
    const result = runCLI([
      'config',
      'set',
      'workflow_defaults.planning',
      'Always use batch mode.',
    ], tmp)
    assert.equal(result.status, 0)
    assert.equal(result.stdout.trim(), 'Always use batch mode.')

    const raw = await readFile(join(tmp, '.esper', 'esper.json'), 'utf8')
    const json = JSON.parse(raw)
    assert.equal(json.workflow_defaults.planning, 'Always use batch mode.')
    // Other keys preserved
    assert.equal(json.workflow_defaults.commits, 'One commit per increment.')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('config get — reads new config sections via dot-notation', async () => {
  const config = {
    schema_version: 2,
    backlog_mode: 'local',
    spec_root: 'specs',
    commands: { test: '', lint: '', typecheck: '', dev: '' },
    workflow_defaults: { planning: 'Default to atom.', commits: 'One per increment.', pull_requests: '', validation: '', spec_sync: '', review: '', retention: '' },
    spec_policy: { maintenance: 'Always update specs.', approval: 'Require approval.', drift: 'Fail on drift.' },
    increment_policy: { sizing: 'Small.', batching: 'Batch when needed.', execution: 'Interactive default.', max_files_per_atomic_increment: 8 },
    agent_roles: {
      orchestrator: { provider: 'codex', host: 'codex', fresh_invocation: true, launch: { command: 'codex', args: [], env: {}, workdir_strategy: 'repo-root', permission_profile: 'default' } },
      implementer: { provider: 'claude-code', host: 'claude-code', fresh_invocation: true, launch: { command: 'claude', args: ['code'], env: {}, workdir_strategy: 'task-worktree', permission_profile: 'bypass' } },
      reviewer: { provider: 'codex', host: 'codex', fresh_invocation: true, launch: { command: 'codex', args: [], env: {}, workdir_strategy: 'task-worktree', permission_profile: 'read-heavy' } },
    },
    autonomous_run_policy: { enabled: true, max_review_rounds: 3, max_runtime_minutes: 60, max_cost: null, require_distinct_reviewer: true, allow_parallel_tasks: true },
    provider_defaults: {},
  }
  const tmp = await setupEsperProject(config)
  try {
    // Top-level section
    let result = runCLI(['config', 'get', 'spec_policy'], tmp)
    assert.equal(result.status, 0)
    const sp = JSON.parse(result.stdout)
    assert.equal(sp.maintenance, 'Always update specs.')

    // Dot-notation
    result = runCLI(['config', 'get', 'agent_roles.orchestrator.provider'], tmp)
    assert.equal(result.status, 0)
    assert.equal(result.stdout.trim(), 'codex')

    result = runCLI(['config', 'get', 'autonomous_run_policy.max_review_rounds'], tmp)
    assert.equal(result.status, 0)
    assert.equal(result.stdout.trim(), '3')

    result = runCLI(['config', 'get', 'increment_policy.max_files_per_atomic_increment'], tmp)
    assert.equal(result.status, 0)
    assert.equal(result.stdout.trim(), '8')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('config set — sets nested key via dot-notation', async () => {
  const config = {
    schema_version: 2,
    backlog_mode: 'local',
    spec_root: 'specs',
    commands: { test: '', lint: '', typecheck: '', dev: '' },
    workflow_defaults: { planning: '', commits: '', pull_requests: '', validation: '', spec_sync: '', review: '', retention: '' },
    agent_roles: {
      orchestrator: { provider: '', host: '', fresh_invocation: true, launch: {} },
      implementer: { provider: '', host: '', fresh_invocation: true, launch: {} },
      reviewer: { provider: '', host: '', fresh_invocation: true, launch: {} },
    },
    autonomous_run_policy: { enabled: false, max_review_rounds: 3, max_runtime_minutes: 60, max_cost: null, require_distinct_reviewer: true, allow_parallel_tasks: false },
  }
  const tmp = await setupEsperProject(config)
  try {
    let result = runCLI(['config', 'set', 'agent_roles.orchestrator.provider', 'codex'], tmp)
    assert.equal(result.status, 0)

    const raw = await readFile(join(tmp, '.esper', 'esper.json'), 'utf8')
    const json = JSON.parse(raw)
    assert.equal(json.agent_roles.orchestrator.provider, 'codex')
    // Other fields preserved
    assert.equal(json.agent_roles.implementer.provider, '')

    result = runCLI(['config', 'set', 'autonomous_run_policy.enabled', 'true'], tmp)
    assert.equal(result.status, 0)
    const raw2 = await readFile(join(tmp, '.esper', 'esper.json'), 'utf8')
    const json2 = JSON.parse(raw2)
    assert.equal(json2.autonomous_run_policy.enabled, true)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('init — creates new config sections in esper.json', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-config-test-'))
  try {
    const result = spawnSync(process.execPath, [join(dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'cli.js'), 'init'], { cwd: tmp, encoding: 'utf8' })
    assert.equal(result.status, 0)
    const raw = await readFile(join(tmp, '.esper', 'esper.json'), 'utf8')
    const config = JSON.parse(raw)

    // New sections exist
    assert.ok(config.spec_policy)
    assert.equal(typeof config.spec_policy.maintenance, 'string')
    assert.ok(config.increment_policy)
    assert.equal(typeof config.increment_policy.max_files_per_atomic_increment, 'number')
    assert.ok(config.agent_roles)
    assert.ok(config.agent_roles.orchestrator)
    assert.ok(config.agent_roles.implementer)
    assert.ok(config.agent_roles.reviewer)
    assert.ok(config.autonomous_run_policy)
    assert.equal(config.autonomous_run_policy.enabled, false)
    assert.ok(config.provider_defaults !== undefined)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('config set — refreshes context.json on any mutation', async () => {
  const tmp = await setupEsperProject()
  try {
    // Modify a key that isn't commands or spec_root
    const result = runCLI(['config', 'set', 'backlog_mode', 'github'], tmp)
    assert.equal(result.status, 0)

    // context.json should still exist and be valid
    const ctx = JSON.parse(await readFile(join(tmp, '.esper', 'context.json'), 'utf8'))
    assert.ok(ctx.schema_version)
    assert.equal(ctx.spec_root, 'specs')
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
