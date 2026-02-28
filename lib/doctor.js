import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

/**
 * Check project health and print a report.
 */
export async function run() {
  const cwd = process.cwd()
  const esperDir = join(cwd, '.esper')
  const findings = []
  let hasError = false

  // Check esper.json
  const esperJson = join(esperDir, 'esper.json')
  if (!existsSync(esperJson)) {
    findings.push({ level: 'fail', msg: 'esper.json not found' })
    hasError = true
  } else {
    try {
      const config = JSON.parse(await readFile(esperJson, 'utf8'))
      findings.push({ level: 'ok', msg: 'esper.json valid' })

      // Check schema_version
      if (config.schema_version) {
        findings.push({ level: 'ok', msg: `schema_version: ${config.schema_version}` })
      } else {
        findings.push({ level: 'warn', msg: 'schema_version missing from esper.json' })
      }

      // Check spec_root
      const specRoot = config.spec_root ?? 'specs'
      const specRootPath = join(cwd, specRoot)
      if (existsSync(specRootPath)) {
        findings.push({ level: 'ok', msg: `spec_root: ${specRoot}` })
        // Check index.md
        if (existsSync(join(specRootPath, 'index.md'))) {
          findings.push({ level: 'ok', msg: 'spec index.md exists' })
        } else {
          findings.push({ level: 'warn', msg: 'spec index.md missing' })
        }
      } else {
        findings.push({ level: 'warn', msg: `spec_root directory missing: ${specRoot}` })
      }

      // Check commands
      if (config.commands?.test) {
        findings.push({ level: 'ok', msg: `test command: ${config.commands.test}` })
      } else {
        findings.push({ level: 'warn', msg: 'test command not configured' })
      }
    } catch {
      findings.push({ level: 'fail', msg: 'esper.json is invalid JSON' })
      hasError = true
    }
  }

  // Check context.json
  const ctxPath = join(esperDir, 'context.json')
  if (!existsSync(ctxPath)) {
    findings.push({ level: 'warn', msg: 'context.json not found' })
  } else {
    try {
      JSON.parse(await readFile(ctxPath, 'utf8'))
      findings.push({ level: 'ok', msg: 'context.json valid' })
    } catch {
      findings.push({ level: 'fail', msg: 'context.json is invalid JSON' })
      hasError = true
    }
  }

  // Check CONSTITUTION.md
  if (existsSync(join(esperDir, 'CONSTITUTION.md'))) {
    findings.push({ level: 'ok', msg: 'CONSTITUTION.md exists' })
  } else {
    findings.push({ level: 'warn', msg: 'CONSTITUTION.md missing' })
  }

  // Check WORKFLOW.md
  if (existsSync(join(esperDir, 'WORKFLOW.md'))) {
    findings.push({ level: 'ok', msg: 'WORKFLOW.md exists' })
  } else {
    findings.push({ level: 'warn', msg: 'WORKFLOW.md missing' })
  }

  // Check increment directories
  const incBase = join(esperDir, 'increments')
  for (const d of ['pending', 'active', 'done', 'archived']) {
    if (existsSync(join(incBase, d))) {
      findings.push({ level: 'ok', msg: `increments/${d}/ exists` })
    } else {
      findings.push({ level: 'warn', msg: `increments/${d}/ missing` })
    }
  }

  // Print report
  for (const f of findings) {
    const tag = f.level === 'ok' ? '[ok]  ' : f.level === 'warn' ? '[warn]' : '[fail]'
    console.log(`  ${tag} ${f.msg}`)
  }

  process.exit(hasError ? 1 : 0)
}
