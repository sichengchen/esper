#!/usr/bin/env node

import { readdir, cp, mkdir, chmod, rm } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { homedir } from 'os'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = join(__dirname, '..')
const CLAUDE_SKILLS_DIR = process.env.ESPER_SKILLS_DIR ?? join(homedir(), '.claude', 'skills')

// --- Flag parsing ---

function parseFlags(args) {
  const opts = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--') && i + 1 < args.length) {
      const key = args[i].slice(2)
      opts[key] = args[++i]
    }
  }
  return opts
}

// --- Subcommand routing ---

const [subcommand, action, ...rest] = process.argv.slice(2)

async function main() {
  switch (subcommand) {
    case 'config': {
      const { check, get, set, checkGh } = await import('../lib/config.js')
      switch (action) {
        case 'check':    return check()
        case 'check-gh': return checkGh()
        case 'get':      return get(rest[0])
        case 'set':      return set(rest[0], rest[1])
        default:
          console.error('Usage: esper config <check|check-gh|get|set>')
          process.exit(1)
      }
      break
    }
    case 'plan': {
      const plan = await import('../lib/plan.js')
      switch (action) {
        case 'list': {
          const opts = parseFlags(rest)
          return plan.list(opts)
        }
        case 'get':      return plan.get(rest[0])
        case 'next-id':  return plan.nextId()
        case 'activate': return plan.activate(rest[0])
        case 'suspend':  return plan.suspend(rest[0])
        case 'finish':   return plan.finish(rest[0])
        case 'archive':  return plan.archive(rest[0])
        case 'set':           return plan.set(rest[0], rest[1], rest[2])
        case 'create-issue':  return plan.createIssue(rest[0])
        case 'close-issue': {
          const opts = parseFlags(rest.slice(1))
          return plan.closeIssue(rest[0], opts.comment)
        }
        default:
          console.error('Usage: esper plan <list|get|next-id|activate|suspend|finish|archive|set|create-issue|close-issue>')
          process.exit(1)
      }
      break
    }
    case 'backlog': {
      const { display } = await import('../lib/backlog.js')
      const opts = parseFlags([action, ...rest].filter(Boolean))
      return display(opts)
    }
    case undefined:
    case 'install':
      return install()
    default:
      console.error(`Unknown command: ${subcommand}`)
      console.error('Usage: esper [install|config|plan|backlog]')
      process.exit(1)
  }
}

// --- Install handler ---

async function install() {
  console.log('Installing esper skills to ~/.claude/skills/...\n')

  const skillsSource = join(PACKAGE_ROOT, 'skills')
  const skillDirs = await readdir(skillsSource)

  for (const skill of skillDirs) {
    const src = join(skillsSource, skill)
    const dest = join(CLAUDE_SKILLS_DIR, skill)

    if (existsSync(dest)) {
      console.log(`  ~ ${skill} (updating)`)
    } else {
      console.log(`  + ${skill}`)
    }

    await mkdir(dest, { recursive: true })
    await cp(src, dest, { recursive: true })

    // Make any .sh files executable
    const files = await readdir(dest)
    for (const file of files) {
      if (file.endsWith('.sh')) {
        await chmod(join(dest, file), 0o755)
      }
    }
  }

  // Remove stale skills from previous versions
  const REMOVED_SKILLS = ['esper-build', 'esper-new', 'esper-done', 'esper-commit']
  const anyRemoved = REMOVED_SKILLS.some(s => existsSync(join(CLAUDE_SKILLS_DIR, s)))
  if (anyRemoved) {
    console.log('')
    for (const skill of REMOVED_SKILLS) {
      const dest = join(CLAUDE_SKILLS_DIR, skill)
      if (existsSync(dest)) {
        console.log(`  - ${skill} (removed — replaced in this version)`)
        await rm(dest, { recursive: true, force: true })
      }
    }
  }

  const inGitRepo = existsSync(join(process.cwd(), '.git'))
  const alreadyInit = existsSync(join(process.cwd(), '.esper', 'esper.json'))

  console.log('')

  if (alreadyInit) {
    console.log('Done. esper is already set up in this project.')
    console.log('Open Claude Code here and run /esper:backlog to see your queue.')
  } else if (inGitRepo) {
    console.log('Done. Open Claude Code in this directory and run:')
    console.log('')
    console.log('  /esper:init "what you want to build"')
  } else {
    console.log('Done. Navigate to your project directory, then open Claude Code and run:')
    console.log('')
    console.log('  /esper:init "what you want to build"')
  }
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
