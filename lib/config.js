import { readFile, writeFile } from 'fs/promises'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { update as updateContext } from './context.js'

const execFileAsync = promisify(execFile)

const ESPER_JSON = () => join(process.cwd(), '.esper', 'esper.json')

export function defaults() {
  return {
    schema_version: 2,
    backlog_mode: 'local',
    spec_root: 'specs',
    commands: { test: '', lint: '', typecheck: '', dev: '' },
    workflow_defaults: {
      planning: 'Default to atom. Switch to batch when the approved work spans multiple feature slices, spec areas, or merge-conflict-prone tasks.',
      session_bootstrap: 'Re-establish current project state with configured baseline checks before resuming any interrupted work.',
      implementation_style: 'Prefer red-green loops from approved behavior descriptions and scenarios when the change is bounded and testable.',
      commits: 'Create one commit per validated increment. Leave partial work uncommitted unless the user explicitly asks for checkpoint commits.',
      pull_requests: 'Open one PR per completed increment. Group related atomic follow-ups into the same PR only when they ship together.',
      validation: 'Run the configured test and typecheck commands before marking work complete. Treat configured checks as blocking unless the active increment says otherwise.',
      spec_sync: 'Sync specs proactively after implementation and before close-out whenever behavior, architecture, or interfaces change.',
      review: 'Run esper:review before esper:sync. In autonomous runs, require a reviewer pass before returning the candidate to the human.',
      explanations: 'Emit walkthrough or explanation artifacts when review risk is high or the increment introduces non-obvious architectural choices.',
      retention: 'Keep completed increments in done until the next explicit archive step or release cleanup.',
    },
    spec_policy: {
      maintenance: 'Require spec updates before close-out whenever behavior, architecture, or public interfaces change.',
      approval: 'Start implementation only after the referenced spec sections are approved and free of unresolved comments.',
      drift: 'Treat missing spec links, missing spec updates, and stale references as review failures.',
    },
    increment_policy: {
      sizing: 'Keep atomic increments small enough for one review pass and one coherent commit.',
      batching: 'Use batch mode when the approved work spans multiple feature slices, staged merges, or independently reviewable steps.',
      execution: 'Use interactive execution by default. Use autonomous execution only when the parent increment defines task boundaries and review guardrails clearly.',
      max_files_per_atomic_increment: 8,
    },
    agent_roles: {
      orchestrator: {
        provider: '',
        host: '',
        fresh_invocation: true,
        launch: {
          command: '',
          args: [],
          env: {},
          workdir_strategy: 'repo-root',
          permission_profile: 'default',
        },
      },
      implementer: {
        provider: '',
        host: '',
        fresh_invocation: true,
        launch: {
          command: '',
          args: [],
          env: {},
          workdir_strategy: 'task-worktree',
          permission_profile: 'default',
        },
      },
      reviewer: {
        provider: '',
        host: '',
        fresh_invocation: true,
        launch: {
          command: '',
          args: [],
          env: {},
          workdir_strategy: 'task-worktree',
          permission_profile: 'read-heavy',
        },
      },
    },
    autonomous_run_policy: {
      enabled: false,
      max_review_rounds: 3,
      max_runtime_minutes: 60,
      max_cost: null,
      require_distinct_reviewer: true,
      allow_parallel_tasks: false,
    },
    provider_defaults: {},
  }
}

export function getSpecRoot() {
  const path = ESPER_JSON()
  if (!existsSync(path)) return join(process.cwd(), 'specs')
  const raw = readFileSync(path, 'utf8')
  const json = JSON.parse(raw)
  return join(process.cwd(), json.spec_root ?? 'specs')
}

export function getWorkflowDefault(key) {
  const path = ESPER_JSON()
  if (!existsSync(path)) return defaults().workflow_defaults[key]
  const raw = readFileSync(path, 'utf8')
  const json = JSON.parse(raw)
  const wd = json.workflow_defaults ?? defaults().workflow_defaults
  return wd[key]
}

export async function check() {
  if (existsSync(ESPER_JSON())) {
    process.exit(0)
  } else {
    process.exit(1)
  }
}

export async function get(key) {
  const raw = await readFile(ESPER_JSON(), 'utf8')
  const json = JSON.parse(raw)
  if (key) {
    // Support dot-notation for nested keys
    const parts = key.split('.')
    let value = json
    for (const part of parts) {
      if (value === undefined || value === null || typeof value !== 'object') {
        value = undefined
        break
      }
      value = value[part]
    }
    if (value === undefined) {
      console.error(`Key "${key}" not found in esper.json`)
      process.exit(1)
    }
    console.log(typeof value === 'string' ? value : JSON.stringify(value, null, 2))
  } else {
    console.log(JSON.stringify(json, null, 2))
  }
}

export async function set(key, value) {
  const raw = await readFile(ESPER_JSON(), 'utf8')
  const json = JSON.parse(raw)

  // Try to parse value as JSON (for objects/arrays/numbers/booleans)
  let parsed
  try {
    parsed = JSON.parse(value)
  } catch {
    parsed = value
  }

  // Support dot-notation for nested keys (e.g. "agent_roles.orchestrator.provider")
  const parts = key.split('.')
  if (parts.length > 1) {
    let target = json
    for (let i = 0; i < parts.length - 1; i++) {
      if (target[parts[i]] === undefined || target[parts[i]] === null || typeof target[parts[i]] !== 'object') {
        target[parts[i]] = {}
      }
      target = target[parts[i]]
    }
    target[parts[parts.length - 1]] = parsed
  } else {
    json[key] = parsed
  }

  await writeFile(ESPER_JSON(), JSON.stringify(json, null, 2) + '\n')
  await syncContext(parts[0], json)
  console.log(typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2))
}

async function syncContext(key, config) {
  if (key === 'commands') {
    await updateContext({ commands: config.commands ?? defaults().commands })
    return
  }

  if (key === 'spec_root') {
    await updateContext({ spec_root: config.spec_root ?? defaults().spec_root })
  }
}

export async function checkGh() {
  try {
    await execFileAsync('gh', ['auth', 'status'])
    process.exit(0)
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error('gh CLI not found. Install it from https://cli.github.com/')
    } else {
      console.error('gh CLI not authenticated. Run: gh auth login')
    }
    process.exit(1)
  }
}
