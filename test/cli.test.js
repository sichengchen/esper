import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CLI = join(__dirname, '..', 'bin', 'cli.js')
const SKILLS_SOURCE = join(__dirname, '..', 'skills')

function runCLI(args = [], env = {}) {
  return spawnSync(process.execPath, [CLI, ...args], {
    env: { ...process.env, ...env },
    encoding: 'utf8',
  })
}

test('installs all skill directories into a fresh target dir (default Claude target)', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-test-'))
  try {
    const result = runCLI([], { ESPER_SKILLS_DIR: tmp })
    assert.equal(result.status, 0, `CLI exited with ${result.status}\n${result.stderr}`)

    const expectedSkills = await readdir(SKILLS_SOURCE)
    const installedSkills = await readdir(tmp)
    for (const skill of expectedSkills) {
      assert.ok(installedSkills.includes(skill), `Expected ${skill} to be installed`)
      assert.ok(existsSync(join(tmp, skill, 'SKILL.md')), `Expected ${skill}/SKILL.md to exist`)
    }
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('updates existing skill directories without error', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-test-'))
  try {
    // First install
    let result = runCLI([], { ESPER_SKILLS_DIR: tmp })
    assert.equal(result.status, 0, `First install failed\n${result.stderr}`)

    // Second install (update)
    result = runCLI([], { ESPER_SKILLS_DIR: tmp })
    assert.equal(result.status, 0, `Second install failed\n${result.stderr}`)
    assert.ok(result.stdout.includes('(updating)'), 'Expected "(updating)" in output on second run')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('removes stale skill directories from previous versions', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-test-'))
  try {
    // Simulate stale skills from a previous version being present
    const staleSkills = ['esper-build', 'esper-new', 'esper-done', 'esper-commit']
    for (const skill of staleSkills) {
      const { mkdir: mkdirSync } = await import('node:fs/promises')
      await mkdirSync(join(tmp, skill), { recursive: true })
    }

    const result = runCLI([], { ESPER_SKILLS_DIR: tmp })
    assert.equal(result.status, 0, `CLI exited with ${result.status}\n${result.stderr}`)

    // Stale skills should be removed
    for (const skill of staleSkills) {
      assert.ok(!existsSync(join(tmp, skill)), `Expected stale skill ${skill} to be removed`)
    }
    assert.ok(result.stdout.includes('(removed'), 'Expected removal message in output')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('installs .sh scripts with execute permissions', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-test-'))
  try {
    const result = runCLI([], { ESPER_SKILLS_DIR: tmp })
    assert.equal(result.status, 0, `CLI exited with ${result.status}\n${result.stderr}`)

    // Check that any .sh files in installed skills are executable
    const { stat } = await import('node:fs/promises')
    const installedSkills = await readdir(tmp)
    for (const skill of installedSkills) {
      const skillDir = join(tmp, skill)
      const files = await readdir(skillDir)
      for (const file of files) {
        if (file.endsWith('.sh')) {
          const s = await stat(join(skillDir, file))
          // Check owner execute bit (0o100)
          assert.ok(s.mode & 0o100, `Expected ${skill}/${file} to be executable`)
        }
      }
    }
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('exits with code 0 on success', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-test-'))
  try {
    const result = runCLI([], { ESPER_SKILLS_DIR: tmp })
    assert.equal(result.status, 0)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('installs to Codex target when provider=codex', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-test-'))
  const claudeDir = join(tmp, 'claude-skills')
  const codexHome = join(tmp, 'codex-home')
  const codexSkills = join(codexHome, 'skills')
  try {
    const result = runCLI(['install', '--provider', 'codex'], {
      ESPER_CLAUDE_SKILLS_DIR: claudeDir,
      CODEX_HOME: codexHome,
    })
    assert.equal(result.status, 0, `CLI exited with ${result.status}\n${result.stderr}`)

    const expectedSkills = await readdir(SKILLS_SOURCE)
    const installedSkills = await readdir(codexSkills)
    for (const skill of expectedSkills) {
      assert.ok(installedSkills.includes(skill), `Expected ${skill} to be installed for Codex`)
    }
    assert.ok(!existsSync(join(claudeDir, 'esper-init')), 'Claude dir should not be populated in codex mode')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('installs to both targets when provider=all', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-test-'))
  const claudeDir = join(tmp, 'claude-skills')
  const codexHome = join(tmp, 'codex-home')
  const codexSkills = join(codexHome, 'skills')
  try {
    const result = runCLI(['install', '--provider', 'all'], {
      ESPER_CLAUDE_SKILLS_DIR: claudeDir,
      CODEX_HOME: codexHome,
    })
    assert.equal(result.status, 0, `CLI exited with ${result.status}\n${result.stderr}`)

    const expectedSkills = await readdir(SKILLS_SOURCE)
    const claudeInstalled = await readdir(claudeDir)
    const codexInstalled = await readdir(codexSkills)

    for (const skill of expectedSkills) {
      assert.ok(claudeInstalled.includes(skill), `Expected ${skill} in Claude target`)
      assert.ok(codexInstalled.includes(skill), `Expected ${skill} in Codex target`)
    }
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})

test('returns non-zero for unknown provider', async () => {
  const result = runCLI(['install', '--provider', 'mystery'])
  assert.notEqual(result.status, 0)
  assert.ok(result.stderr.includes('Unknown provider "mystery"'))
})

test('interactive flag in non-tty mode falls back to non-interactive install', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'esper-test-'))
  try {
    const result = runCLI(['install', '--interactive'], { ESPER_SKILLS_DIR: tmp })
    assert.equal(result.status, 0, `CLI exited with ${result.status}\n${result.stderr}`)
    assert.ok(result.stdout.includes('Installing esperkit skills'))
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
})
