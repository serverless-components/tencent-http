const Koa = require('koa')
const KoaRouter = require('koa-router')
const sendFile = require('koa-sendfile')
const path = require('path')

const app = new Koa()
const router = new KoaRouter()

// Routes
router.get(`/*`, async (ctx) => {
  await sendFile(ctx, path.join(__dirname, 'index.html'))
})

app.use(router.allowedMethods()).use(router.routes())

app.listen(9000, () => {
  console.log(`Server start on http://localhost:9000`);
})

