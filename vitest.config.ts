import { defineConfig } from 'vitest/config'
import { readFileSync } from 'node:fs'

function parseDotenv(path: string): Record<string, string> {
  try {
    return Object.fromEntries(
      readFileSync(path, 'utf-8')
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .map(line => line.split('=', 2) as [string, string])
    )
  } catch {
    return {}
  }
}

export default defineConfig({
  test: {
    env: parseDotenv('.env'),
    testTimeout: 15000,
  },
})
