## 文件上传说明

由于 API 网关是将文件请求直接转发给 Web 函数，所以针对文件上传，不在需要进行 `Base64` 编码了，直接把文件内容作为参数传入即可。

> 注意：当前 API 网关支持上传最大文件大小为 `2M`，如果文件过大，请修改为前端直传对象存储方案。

## 代码示例

自定义服务为 Express:

```js
const multer = require('multer');
const express = require('express');
const next = require('next');

const isServerless = process.env.SERVERLESS;

const upload = multer({ dest: isServerless ? '/tmp/upload' : './upload' });

const server = express();
const app = next({ dev: false });
const handle = app.getRequestHandler();

server.post('/upload', upload.single('file'), (req, res) => {
  res.send({
    success: true,
    data: req.file,
  });
});

server.all('*', (req, res, next) => {
  return handle(req, res);
});

server.listen(9000, () => {
  console.log(`Server start on http://localhost:9000`);
});
```

自定义服务为 Koa：

```js
const Koa = require('koa');
const Router = require('@koa/router');
const multer = require('@koa/multer');
const next = require('next');

const isServerless = process.env.SERVERLESS;

const server = new Koa();
const router = new Router();
const upload = multer({ dest: isServerless ? '/tmp/upload' : './upload' });
const app = next({ dev: false });
const handle = app.getRequestHandler();

router.post('/upload', upload.single('file'), (ctx) => {
  ctx.body = {
    success: true,
    data: ctx.file,
  };
});

server.use(router.routes()).use(router.allowedMethods());

server.use((ctx) => {
  ctx.status = 200;
  ctx.respond = false;
  ctx.req.ctx = ctx;

  return handle(ctx.req, ctx.res);
});

server.listen(9000, () => {
  console.log(`Server start on http://localhost:9000`);
});
```

开发者可根据个人项目需要参考修改。

上述代码中实现了文件上传接口 `POST /upload`。使用 Koa 的项目，如果要支持文件上传，需要安装 `@koajs/multer` 和 `multer` 包。使用 Express 的项目，如果要支持文件上传，需要安装 `multer` 包。
