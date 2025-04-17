import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    maxConcurrency: 1,
    // Configuração para usar apenas 1 processo
    poolOptions: {
      threads: {
        isolate: true,
        maxThreads: 1,
        singleThread: true
      }
    },
    isolate: true,
    testTimeout: 1000 * 60 * 60
  }
})
