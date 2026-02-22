import { readdir, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { parseFrontmatter } from './frontmatter.js'

const PLANS_DIR = () => join(process.cwd(), '.esper', 'plans')

async function readPlansFromDir(dir) {
  if (!existsSync(dir)) return []
  const files = await readdir(dir)
  const plans = []
  for (const file of files) {
    if (!file.endsWith('.md')) continue
    const content = await readFile(join(dir, file), 'utf8')
    const { frontmatter } = parseFrontmatter(content)
    plans.push({ ...frontmatter, _file: file })
  }
  return plans
}

export async function display(options = {}) {
  const { format = 'table', phase } = options
  const base = PLANS_DIR()

  let active = await readPlansFromDir(join(base, 'active'))
  let pending = await readPlansFromDir(join(base, 'pending'))
  let done = await readPlansFromDir(join(base, 'done'))

  if (phase) {
    active = active.filter(p => p.phase === phase)
    pending = pending.filter(p => p.phase === phase)
    done = done.filter(p => p.phase === phase)
  }

  // Sort pending by priority asc, then id asc
  pending.sort((a, b) => {
    const pa = a.priority ?? 9
    const pb = b.priority ?? 9
    if (pa !== pb) return pa - pb
    return (a.id ?? 999) - (b.id ?? 999)
  })

  // Sort done by shipped_at desc, take last 3
  done.sort((a, b) => {
    const sa = a.shipped_at ?? '0000-00-00'
    const sb = b.shipped_at ?? '0000-00-00'
    return sb.localeCompare(sa)
  })
  const recentDone = done.slice(0, 3)

  if (format === 'json') {
    const output = { active, pending, done: recentDone }
    // Strip internal fields
    for (const key of Object.keys(output)) {
      output[key] = output[key].map(({ _file, ...rest }) => rest)
    }
    console.log(JSON.stringify(output, null, 2))
    return
  }

  let hasContent = false

  if (active.length > 0) {
    console.log('ACTIVE')
    for (const p of active) {
      const id = String(p.id ?? '?')
      const title = (p.title ?? 'Untitled').padEnd(45)
      const ph = p.phase ?? ''
      const branch = p.branch ?? ''
      const issue = p.gh_issue ? ` (#${p.gh_issue})` : ''
      console.log(`  #${id}${issue} · ${title} [${ph}]  branch: ${branch}`)
    }
    console.log('')
    hasContent = true
  }

  if (pending.length > 0) {
    console.log('PENDING')
    for (const p of pending) {
      const id = String(p.id ?? '?')
      const title = (p.title ?? 'Untitled').padEnd(45)
      const priority = `p${p.priority ?? '?'}`
      const ph = p.phase ?? ''
      const issue = p.gh_issue ? ` (#${p.gh_issue})` : ''
      console.log(`  #${id}${issue} · ${title} ${priority.padEnd(3)} [${ph}]`)
    }
    console.log('')
    hasContent = true
  }

  if (recentDone.length > 0) {
    console.log('DONE (last 3)')
    for (const p of recentDone) {
      const id = String(p.id ?? '?')
      const title = (p.title ?? 'Untitled').padEnd(45)
      const date = p.shipped_at ?? 'unknown'
      const issue = p.gh_issue ? ` (#${p.gh_issue})` : ''
      console.log(`  #${id}${issue} · ${title}  shipped ${date}`)
    }
    console.log('')
    hasContent = true
  }

  if (!hasContent) {
    console.log('Backlog is empty. Run `/esper:plan` to add your first feature, or `/esper:fix` to log a bug.')
  }
}
