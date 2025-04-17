import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    maxConcurrency: 5,
    // Limita a quantidade de processos em paralelo para 5
    
    isolate: true
  }
})
