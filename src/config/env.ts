export interface AppConfig {
  nodeEnv: string
  port: number
  jwtSecret: string
  databaseUrl: string
  logLevel: string
  enableAiQuestions: boolean
  ollamaModel: string
}

function validateEnv(): void {
  const nodeEnv = process.env.NODE_ENV ?? 'development'
  const isProduction = nodeEnv === 'production'

  // Required in all environments
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required')
  }

  // Production-only validations
  if (isProduction) {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret || jwtSecret === 'dev-secret-change-in-production' || jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must be set to a secure random string (32+ chars) in production. Generate with: openssl rand -base64 32')
    }

    // Ensure DATABASE_URL uses SSL
    if (!process.env.DATABASE_URL.includes('sslmode=require')) {
      throw new Error('DATABASE_URL must use sslmode=require in production')
    }
  }
}

export function getConfig(): AppConfig {
  validateEnv()

  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3000),
    jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    databaseUrl: process.env.DATABASE_URL!,
    logLevel: process.env.LOG_LEVEL ?? 'info',
    enableAiQuestions: process.env.ENABLE_AI_GENERAL_QUESTIONS === 'true',
    ollamaModel: process.env.OLLAMA_MODEL ?? 'qwen3:4b'
  }
}

// Re-export validateEnv for testing
export { validateEnv }