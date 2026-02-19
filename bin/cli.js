#!/usr/bin/env node

import { readdir, cp, mkdir, chmod, rm } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { homedir } from 'os'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = join(__dirname, '..')
const CLAUDE_SKILLS_DIR = process.env.ESPER_SKILLS_DIR ?? join(homedir(), '.claude', 'skills')

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

install().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
