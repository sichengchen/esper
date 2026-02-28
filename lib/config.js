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
    const value = json[key]
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

  json[key] = parsed
  await writeFile(ESPER_JSON(), JSON.stringify(json, null, 2) + '\n')
  await syncContext(key, json)
  console.log(typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2))
}

async function syncContext(key, config) {
  if (key === 'commands') {
    await updateContext({ commands: config.commands ?? defaults().commands })
    return
  }

  if (key === 'workflow_defaults') {
    await updateContext({
      workflow_mode: config.workflow_defaults?.default_work_mode ?? defaults().workflow_defaults.default_work_mode,
    })
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
