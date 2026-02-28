#!/usr/bin/env node

import { readdir, cp, mkdir, chmod, rm } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { homedir } from 'os'
import { fileURLToPath } from 'url'
import { emitKeypressEvents, cursorTo, clearScreenDown } from 'readline'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = join(__dirname, '..')
const CLAUDE_SKILLS_DIR = process.env.ESPER_CLAUDE_SKILLS_DIR
  ?? process.env.ESPER_SKILLS_DIR
  ?? join(homedir(), '.claude', 'skills')
const CODEX_HOME = process.env.CODEX_HOME ?? join(homedir(), '.codex')
const CODEX_SKILLS_DIR = process.env.ESPER_CODEX_SKILLS_DIR ?? join(CODEX_HOME, 'skills')
const REMOVED_SKILLS = [
  'esper-build', 'esper-new', 'esper-done', 'esper-commit',
  'esper-apply', 'esper-audit', 'esper-backlog', 'esper-explore',
  'esper-finish', 'esper-fix', 'esper-phase', 'esper-plan',
  'esper-revise', 'esper-ship', 'esper-yolo',
]
const VALID_PROVIDERS = new Set(['claude', 'codex', 'all'])
const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
}
const COLOR_ENABLED = process.stdout.isTTY && process.env.NO_COLOR === undefined

// --- Flag parsing ---

function parseFlags(args) {
  const opts = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2)
      const value = args[i + 1]
      if (value && !value.startsWith('--')) {
        opts[key] = value
        i++
      } else {
        opts[key] = true
      }
    }
  }
  return opts
}

function isTruthy(value) {
  if (value === true) return true
  if (typeof value !== 'string') return false
  const lowered = value.toLowerCase()
  return lowered === '1' || lowered === 'true' || lowered === 'yes'
}

function isFalsy(value) {
  if (value === false) return true
  if (typeof value !== 'string') return false
  const lowered = value.toLowerCase()
  return lowered === '0' || lowered === 'false' || lowered === 'no'
}

function style(text, color) {
  if (!COLOR_ENABLED) return text
  return `${color}${text}${ANSI.reset}`
}

function bold(text) {
  return style(text, ANSI.bold)
}

function dim(text) {
  return style(text, ANSI.dim)
}

function green(text) {
  return style(text, ANSI.green)
}

function cyan(text) {
  return style(text, ANSI.cyan)
}

function yellow(text) {
  return style(text, ANSI.yellow)
}

function red(text) {
  return style(text, ANSI.red)
}

function shouldUseTui(options = {}) {
  const explicitProvider = options.provider ?? process.env.ESPER_PROVIDER
  if (explicitProvider) return false
  if (isTruthy(options['no-tui'] ?? process.env.ESPER_NO_TUI)) return false

  const interactiveFlag = options.interactive ?? process.env.ESPER_INTERACTIVE
  if (isTruthy(interactiveFlag)) {
    return process.stdin.isTTY && process.stdout.isTTY
  }
  if (isFalsy(interactiveFlag)) return false

  return Boolean(process.stdin.isTTY && process.stdout.isTTY && !process.env.CI)
}

async function promptProvider() {
  const options = [
    { id: 'claude', label: 'Claude Code', path: CLAUDE_SKILLS_DIR },
    { id: 'codex', label: 'Codex', path: CODEX_SKILLS_DIR },
  ]
  const selected = new Set(['claude'])
  let cursorIndex = 0
  let error = ''

  function providerFromSelection() {
    const hasClaude = selected.has('claude')
    const hasCodex = selected.has('codex')
    if (hasClaude && hasCodex) return 'all'
    if (hasCodex) return 'codex'
    return 'claude'
  }

  function render() {
    cursorTo(process.stdout, 0, 0)
    clearScreenDown(process.stdout)
    console.log(`${bold(cyan('esperkit installer'))}`)
    console.log(dim('Use up/down to move, space to select, enter to install.\n'))
    for (let i = 0; i < options.length; i++) {
      const item = options[i]
      const pointer = i === cursorIndex ? cyan('>') : ' '
      const mark = selected.has(item.id) ? green('[x]') : dim('[ ]')
      console.log(` ${pointer} ${mark} ${bold(item.label)} ${dim(`(${item.path})`)}`)
    }
    if (error) {
      console.log(`\n${red(error)}`)
    }
  }

  return new Promise((resolve, reject) => {
    const stdin = process.stdin
    const canSetRaw = typeof stdin.setRawMode === 'function'
    const wasRaw = Boolean(stdin.isRaw)
    let done = false

    const cleanup = () => {
      if (done) return
      done = true
      stdin.off('keypress', onKeypress)
      if (canSetRaw) {
        stdin.setRawMode(wasRaw)
      }
      stdin.pause()
      process.stdout.write('\n')
    }

    const onKeypress = (_str, key) => {
      if (key.ctrl && key.name === 'c') {
        cleanup()
        reject(new Error('Installation cancelled by user'))
        return
      }

      if (key.name === 'up' || key.name === 'k') {
        cursorIndex = (cursorIndex - 1 + options.length) % options.length
        error = ''
        render()
        return
      }

      if (key.name === 'down' || key.name === 'j') {
        cursorIndex = (cursorIndex + 1) % options.length
        error = ''
        render()
        return
      }

      if (key.name === 'space') {
        const id = options[cursorIndex].id
        if (selected.has(id)) {
          selected.delete(id)
        } else {
          selected.add(id)
        }
        error = ''
        render()
        return
      }

      if (key.name === 'return' || key.name === 'enter') {
        if (selected.size === 0) {
          error = 'Select at least one provider before installing.'
          render()
          return
        }
        const provider = providerFromSelection()
        cleanup()
        resolve(provider)
      }
    }

    emitKeypressEvents(stdin)
    stdin.on('keypress', onKeypress)
    if (canSetRaw) {
      stdin.setRawMode(true)
    }
    stdin.resume()
    process.stdout.write('\n')
    render()
  })
}

function resolveProvider(options = {}) {
  const raw = String(options.provider ?? 'claude').toLowerCase()
  if (!VALID_PROVIDERS.has(raw)) {
    throw new Error(`Unknown provider "${raw}". Use --provider claude|codex|all`)
  }
  return raw
}

async function selectProvider(options = {}) {
  const explicitProvider = options.provider ?? process.env.ESPER_PROVIDER
  if (explicitProvider) {
    return { provider: resolveProvider({ provider: explicitProvider }), usedTui: false }
  }
  if (!shouldUseTui(options)) {
    return { provider: resolveProvider({ provider: 'claude' }), usedTui: false }
  }
  const provider = await promptProvider()
  return { provider, usedTui: true }
}

function resolveInstallTargets(provider) {
  const byProvider = {
    claude: [{ name: 'Claude Code', dir: CLAUDE_SKILLS_DIR }],
    codex: [{ name: 'Codex', dir: CODEX_SKILLS_DIR }],
    all: [
      { name: 'Claude Code', dir: CLAUDE_SKILLS_DIR },
      { name: 'Codex', dir: CODEX_SKILLS_DIR },
    ],
  }

  const seen = new Set()
  const targets = []
  for (const target of byProvider[provider]) {
    if (!seen.has(target.dir)) {
      seen.add(target.dir)
      targets.push(target)
    }
  }
  return targets
}

// --- Subcommand routing ---

const argv = process.argv.slice(2)
const [subcommand, action, ...rest] = argv

async function main() {
  if (!subcommand || subcommand === 'install' || subcommand.startsWith('--')) {
    const installArgs = subcommand === 'install'
      ? [action, ...rest].filter(Boolean)
      : argv
    return install(parseFlags(installArgs))
  }

  switch (subcommand) {
    case 'init': {
      const init = await import('../lib/init.js')
      const opts = parseFlags([action, ...rest].filter(Boolean))
      return init.run(opts)
    }
    case 'config': {
      const { check, get, set, checkGh } = await import('../lib/config.js')
      switch (action) {
        case 'check':    return check()
        case 'check-gh': return checkGh()
        case 'get':      return get(rest[0])
        case 'set':      return set(rest[0], rest[1])
        default:
          console.error('Usage: esperkit config <check|check-gh|get|set>')
          process.exit(1)
      }
      break
    }
    case 'context': {
      const context = await import('../lib/context.js')
      switch (action) {
        case 'get': return context.get()
        default:
          console.error('Usage: esperkit context <get>')
          process.exit(1)
      }
      break
    }
    case 'spec': {
      const spec = await import('../lib/spec.js')
      switch (action) {
        case 'index':    return spec.index()
        case 'get':      return spec.get(rest[0])
        case 'create':   return spec.create(rest[0])
        case 'set-root': return spec.setRoot(rest[0])
        case 'archive':  return spec.archive(rest[0])
        case 'list':     return spec.list()
        default:
          console.error('Usage: esperkit spec <index|get|create|set-root|archive|list>')
          process.exit(1)
      }
      break
    }
    case 'increment': {
      const increment = await import('../lib/increment.js')
      switch (action) {
        case 'list': {
          const opts = parseFlags(rest)
          return increment.list(opts)
        }
        case 'get':      return increment.get(rest[0])
        case 'next-id':  return increment.nextId()
        case 'create': {
          const opts = parseFlags(rest)
          return increment.create(opts)
        }
        case 'activate': return increment.activate(rest[0])
        case 'finish':   return increment.finish(rest[0])
        case 'archive':  return increment.archive(rest[0])
        case 'group': {
          const opts = parseFlags(rest)
          return increment.group(opts)
        }
        case 'set':      return increment.set(rest[0], rest[1], rest[2])
        default:
          console.error('Usage: esperkit increment <list|get|next-id|create|activate|finish|archive|group|set>')
          process.exit(1)
      }
      break
    }
    case 'exploration': {
      const exploration = await import('../lib/exploration.js')
      switch (action) {
        case 'list': {
          const opts = parseFlags(rest)
          return exploration.list(opts)
        }
        case 'next-id':  return exploration.nextId()
        case 'get':      return exploration.get(rest[0])
        case 'archive':  return exploration.archive(rest[0])
        default:
          console.error('Usage: esperkit exploration <list|next-id|get|archive>')
          process.exit(1)
      }
      break
    }
    case 'doctor': {
      const doctor = await import('../lib/doctor.js')
      return doctor.run()
    }
    case 'migrate': {
      const migrate = await import('../lib/migrate.js')
      return migrate.run()
    }
    default:
      console.error(`Unknown command: ${subcommand}`)
      console.error('Usage: esperkit [install|init|config|context|spec|increment|exploration|doctor|migrate]')
      process.exit(1)
  }
}

// --- Install handler ---

async function install(options = {}) {
  const { provider, usedTui } = await selectProvider(options)
  const targets = resolveInstallTargets(provider)
  const manyTargets = targets.length > 1

  if (usedTui) {
    console.log('')
    console.log(`${bold('Install plan')}: ${manyTargets ? 'multiple providers' : provider}`)
    for (const target of targets) {
      console.log(`  ${cyan('•')} ${target.name} ${dim(target.dir)}`)
    }
    console.log('')
    console.log(`${bold(cyan('Installing...'))}\n`)
  } else if (manyTargets) {
    console.log('Installing esperkit skills for multiple providers...\n')
  } else if (provider === 'codex') {
    console.log('Installing esperkit skills to Codex...\n')
  } else {
    console.log('Installing esperkit skills to ~/.claude/skills/...\n')
  }

  const skillsSource = join(PACKAGE_ROOT, 'skills')
  const skillDirs = await readdir(skillsSource)

  for (const target of targets) {
    if (usedTui) {
      console.log(`${bold(target.name)} ${dim(target.dir)}`)
    } else if (manyTargets) {
      console.log(`→ ${target.name}: ${target.dir}`)
    }

    for (const skill of skillDirs) {
      const src = join(skillsSource, skill)
      const dest = join(target.dir, skill)

      if (usedTui && existsSync(dest)) {
        console.log(`  ${yellow('↻')} ${skill}`)
      } else if (usedTui) {
        console.log(`  ${green('✓')} ${skill}`)
      } else if (existsSync(dest)) {
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
    const anyRemoved = REMOVED_SKILLS.some(s => existsSync(join(target.dir, s)))
    if (anyRemoved) {
      console.log('')
      for (const skill of REMOVED_SKILLS) {
        const dest = join(target.dir, skill)
        if (existsSync(dest)) {
          if (usedTui) {
            console.log(`  ${yellow('−')} ${skill} ${dim('(removed — replaced in this version)')}`)
          } else {
            console.log(`  - ${skill} (removed — replaced in this version)`)
          }
          await rm(dest, { recursive: true, force: true })
        }
      }
    }

    console.log('')
  }

  const inGitRepo = existsSync(join(process.cwd(), '.git'))
  const alreadyInit = existsSync(join(process.cwd(), '.esper', 'esper.json'))

  if (usedTui) {
    console.log(`${green('✓')} ${bold('Install complete')}\n`)
  }

  if (alreadyInit) {
    console.log('Done. esper is already set up in this project.')
    if (provider === 'claude') {
      console.log('Open Claude Code here and run /esper:context to see your project context.')
    } else if (provider === 'codex') {
      console.log('Open Codex here and run the `esper:context` skill to see your project context.')
    } else {
      console.log('Open Claude Code or Codex here and run /esper:context (Claude) or `esper:context` (Codex).')
    }
  } else if (inGitRepo) {
    if (provider === 'codex') {
      console.log('Done. Open Codex in this directory and run the `esper:init` skill.')
    } else if (provider === 'all') {
      console.log('Done. Open Claude Code or Codex in this directory and run:')
      console.log('')
      console.log('  /esper:init')
      console.log('')
      console.log('In Codex, run the `esper:init` skill.')
    } else {
      console.log('Done. Open Claude Code in this directory and run:')
      console.log('')
      console.log('  /esper:init')
    }
  } else {
    if (provider === 'codex') {
      console.log('Done. Navigate to your project directory, then open Codex and run the `esper:init` skill.')
    } else if (provider === 'all') {
      console.log('Done. Navigate to your project directory, then open Claude Code or Codex and run:')
      console.log('')
      console.log('  /esper:init')
      console.log('')
      console.log('In Codex, run the `esper:init` skill.')
    } else {
      console.log('Done. Navigate to your project directory, then open Claude Code and run:')
      console.log('')
      console.log('  /esper:init')
    }
  }
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
