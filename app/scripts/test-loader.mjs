import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createRequire } from 'module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const require = createRequire(import.meta.url)

const LIB_PATHS = {
  '@/lib/prisma': path.join(__dirname, '../src/lib/prisma.ts'),
  '@/lib/redis': path.join(__dirname, '../src/lib/redis.ts'),
}

export async function resolve(url, parentURL) {
  // Handle @/lib aliases
  for (const [alias, fullPath] of Object.entries(LIB_PATHS)) {
    if (url === alias) {
      return fullPath
    }
  }
  
  // Return null to let normal resolution continue
  return null
}

export async function load(url, context, defaultLoad) {
  // For @/lib aliases, we need to use require to get the actual path
  const resolvedPath = await resolve(url, context.parentURL)
  
  if (resolvedPath) {
    return require(resolvedPath)
  }
  
  return defaultLoad(url, context, defaultLoad)
}
