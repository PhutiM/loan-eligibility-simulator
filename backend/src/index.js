import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { loansRouter } from './loans.js'

const app = express()
const port = Number(process.env.PORT) || 3000
const frontendOrigin = process.env.FRONTEND_ORIGIN

app.use(cors(frontendOrigin ? { origin: frontendOrigin } : { origin: false }))
app.use(express.json())
app.get('/api/openapi.yaml', (_request, response) => {
  response
    .type('application/yaml')
    .sendFile(fileURLToPath(new URL('../openapi.yaml', import.meta.url)))
})
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(null, { swaggerOptions: { url: '/api/openapi.yaml' } }),
)
app.use('/api/loans', loansRouter)

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'loan-eligibility-api' })
})

app.use((error, _request, response, next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return response.status(400).json({
      error: 'Invalid JSON request body',
    })
  }
  return next(error)
})

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  app.listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`)
  })
}

export default app
