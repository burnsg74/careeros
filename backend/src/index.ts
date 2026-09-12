import { app } from './app.js'

const port = Number(process.env.PORT) || 3005

app.listen(port, () => {
  console.log(`careeros-api listening on ${port}`)
})
