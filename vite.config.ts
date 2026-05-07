import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import chatHandler from './api/chat'

const apiChatDevServer = (): Plugin => ({
  name: 'api-chat-dev-server',
  configureServer(server) {
    server.middlewares.use('/api/chat', async (req, res) => {
      let body = ''

      req.on('data', (chunk) => {
        body += chunk
      })

      req.on('end', async () => {
        try {
          await chatHandler(
            { method: req.method, body: body ? JSON.parse(body) : undefined },
            {
              status: (statusCode: number) => ({
                json: (payload: unknown) => {
                  res.statusCode = statusCode
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify(payload))
                },
              }),
            },
          )
        } catch {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ action: 'unknown', message: 'Internal server error' }))
        }
      })
    })
  },
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? env.OPENAI_API_KEY
  process.env.OPENAI_MODEL = process.env.OPENAI_MODEL ?? env.OPENAI_MODEL

  return {
    plugins: [react(), apiChatDevServer()],
  }
})
