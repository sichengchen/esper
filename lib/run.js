import { readFile, writeFile, mkdir, readdir } from 'fs/promises'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { parseFrontmatter } from './frontmatter.js'
import { build, write as writeContext } from './context.js'

const RUNS_DIR = () => join(process.cwd(), '.esper', 'runs')
const INCREMENTS_ACTIVE = () => join(process.cwd(), '.esper', 'increments', 'active')
const ESPER_JSON = () => join(process.cwd(), '.esper', 'esper.json')

function generateRunId() {
  const now = new Date()
  const pad = (n, len = 2) => String(n).padStart(len, '0')
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}

/**
 * Create a new run from an active increment.
 */
export async function create(incrementFile) {
  if (!incrementFile) {
    console.error('Usage: esperkit run create <increment-file>')
    process.exit(1)
  }

  const incPath = join(INCREMENTS_ACTIVE(), incrementFile)
  if (!existsSync(incPath)) {
    console.error(`Increment not found in active: ${incrementFile}`)
    process.exit(1)
  }

  const content = await readFile(incPath, 'utf8')
  const { frontmatter } = parseFrontmatter(content)

  const runId = generateRunId()
  const runDir = join(RUNS_DIR(), runId)
  await mkdir(join(runDir, 'tasks'), { recursive: true })
  await mkdir(join(runDir, 'reviews'), { recursive: true })

  // Read autonomous_run_policy from config for stop conditions
  let policy = { max_review_rounds: 3, max_runtime_minutes: 60, max_cost: null }
  const esperPath = ESPER_JSON()
  if (existsSync(esperPath)) {
    try {
      const config = JSON.parse(readFileSync(esperPath, 'utf8'))
      if (config.autonomous_run_policy) {
        const arp = config.autonomous_run_policy
        policy.max_review_rounds = arp.max_review_rounds ?? policy.max_review_rounds
        policy.max_runtime_minutes = arp.max_runtime_minutes ?? policy.max_runtime_minutes
        policy.max_cost = arp.max_cost ?? policy.max_cost
      }
    } catch { /* use defaults */ }
  }

  const runData = {
    id: runId,
    increment: incrementFile,
    increment_id: frontmatter.id ?? null,
    spec_snapshot: frontmatter.spec ?? null,
    roles: {},
    status: 'executing',
    stop_conditions: {
      max_review_rounds: policy.max_review_rounds,
      max_runtime_minutes: policy.max_runtime_minutes,
      max_cost: policy.max_cost,
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  }

  await writeFile(join(runDir, 'run.json'), JSON.stringify(runData, null, 2) + '\n')

  // Update context
  const ctx = await build()
  ctx.active_run = runId
  ctx.active_execution_mode = 'autonomous'
  await writeContext(ctx)

  console.log(runId)
  return runId
}

/**
 * Get run data by ID.
 */
export async function get(runId) {
  if (!runId) {
    console.error('Usage: esperkit run get <run-id>')
    process.exit(1)
  }

  const runJson = join(RUNS_DIR(), runId, 'run.json')
  if (!existsSync(runJson)) {
    console.error(`Run not found: ${runId}`)
    process.exit(1)
  }

  const data = JSON.parse(await readFile(runJson, 'utf8'))
  console.log(JSON.stringify(data, null, 2))
}

/**
 * List all runs.
 */
export async function list() {
  const dir = RUNS_DIR()
  if (!existsSync(dir)) {
    console.log('No runs found.')
    return
  }

  const entries = await readdir(dir, { withFileTypes: true })
  const runs = []
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const runJson = join(dir, entry.name, 'run.json')
    if (!existsSync(runJson)) continue
    const data = JSON.parse(await readFile(runJson, 'utf8'))
    runs.push({ id: data.id, status: data.status, increment: data.increment, created: data.created })
  }

  if (runs.length === 0) {
    console.log('No runs found.')
    return
  }

  console.log(JSON.stringify(runs, null, 2))
}

/**
 * Stop a run with a reason.
 */
export async function stop(runId, reason) {
  if (!runId) {
    console.error('Usage: esperkit run stop <run-id> [reason]')
    process.exit(1)
  }

  const runJson = join(RUNS_DIR(), runId, 'run.json')
  if (!existsSync(runJson)) {
    console.error(`Run not found: ${runId}`)
    process.exit(1)
  }

  const data = JSON.parse(await readFile(runJson, 'utf8'))
  data.status = 'cancelled'
  data.stop_reason = reason ?? 'Manual stop'
  data.updated = new Date().toISOString()
  await writeFile(runJson, JSON.stringify(data, null, 2) + '\n')

  // Update context
  const ctx = await build()
  await writeContext(ctx)

  console.log(`Run ${runId} stopped.`)
}

/**
 * Update run status.
 */
export async function updateStatus(runId, status) {
  const runJson = join(RUNS_DIR(), runId, 'run.json')
  if (!existsSync(runJson)) {
    console.error(`Run not found: ${runId}`)
    process.exit(1)
  }

  const data = JSON.parse(await readFile(runJson, 'utf8'))
  data.status = status
  data.updated = new Date().toISOString()
  await writeFile(runJson, JSON.stringify(data, null, 2) + '\n')
}

/**
 * Add a task packet to a run.
 */
export async function addTask(runId, task) {
  if (!runId || !task) {
    console.error('Usage: esperkit run add-task <run-id> <task-json>')
    process.exit(1)
  }

  const tasksDir = join(RUNS_DIR(), runId, 'tasks')
  if (!existsSync(tasksDir)) {
    console.error(`Run not found: ${runId}`)
    process.exit(1)
  }

  const taskData = typeof task === 'string' ? JSON.parse(task) : task

  // Auto-assign ID
  const existing = await readdir(tasksDir)
  const nextNum = existing.filter(f => f.endsWith('.json')).length + 1
  const taskId = taskData.id ?? `task-${String(nextNum).padStart(3, '0')}`
  taskData.id = taskId
  taskData.status = taskData.status ?? 'pending'
  taskData.created = new Date().toISOString()

  await writeFile(join(tasksDir, `${taskId}.json`), JSON.stringify(taskData, null, 2) + '\n')
  console.log(taskId)
  return taskId
}

/**
 * Get a task packet.
 */
export async function getTask(runId, taskId) {
  const taskPath = join(RUNS_DIR(), runId, 'tasks', `${taskId}.json`)
  if (!existsSync(taskPath)) {
    console.error(`Task not found: ${runId}/tasks/${taskId}`)
    process.exit(1)
  }

  const data = JSON.parse(await readFile(taskPath, 'utf8'))
  console.log(JSON.stringify(data, null, 2))
}

/**
 * List tasks in a run.
 */
export async function listTasks(runId) {
  const tasksDir = join(RUNS_DIR(), runId, 'tasks')
  if (!existsSync(tasksDir)) {
    console.error(`Run not found: ${runId}`)
    process.exit(1)
  }

  const files = (await readdir(tasksDir)).filter(f => f.endsWith('.json')).sort()
  const tasks = []
  for (const f of files) {
    const data = JSON.parse(await readFile(join(tasksDir, f), 'utf8'))
    tasks.push({ id: data.id, status: data.status, assigned_role: data.assigned_role ?? null })
  }

  console.log(JSON.stringify(tasks, null, 2))
}

/**
 * Add a review record to a run.
 */
export async function addReview(runId, review) {
  if (!runId || !review) {
    console.error('Usage: esperkit run add-review <run-id> <review-json>')
    process.exit(1)
  }

  const reviewsDir = join(RUNS_DIR(), runId, 'reviews')
  if (!existsSync(reviewsDir)) {
    console.error(`Run not found: ${runId}`)
    process.exit(1)
  }

  const reviewData = typeof review === 'string' ? JSON.parse(review) : review

  const existing = await readdir(reviewsDir)
  const nextNum = existing.filter(f => f.endsWith('.json')).length + 1
  const reviewId = reviewData.id ?? `review-${String(nextNum).padStart(3, '0')}`
  reviewData.id = reviewId
  reviewData.run_id = runId
  reviewData.created = new Date().toISOString()

  await writeFile(join(reviewsDir, `${reviewId}.json`), JSON.stringify(reviewData, null, 2) + '\n')
  console.log(reviewId)
  return reviewId
}

/**
 * List reviews in a run.
 */
export async function listReviews(runId) {
  const reviewsDir = join(RUNS_DIR(), runId, 'reviews')
  if (!existsSync(reviewsDir)) {
    console.error(`Run not found: ${runId}`)
    process.exit(1)
  }

  const files = (await readdir(reviewsDir)).filter(f => f.endsWith('.json')).sort()
  const reviews = []
  for (const f of files) {
    const data = JSON.parse(await readFile(join(reviewsDir, f), 'utf8'))
    reviews.push({ id: data.id, result: data.result ?? null, round: data.round ?? null })
  }

  console.log(JSON.stringify(reviews, null, 2))
}
