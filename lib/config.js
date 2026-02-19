import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

const ESPER_JSON = () => join(process.cwd(), '.esper', 'esper.json')

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
  console.log(typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2))
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
