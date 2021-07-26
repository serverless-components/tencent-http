## 文件上传说明

由于 API 网关是将文件请求直接转发给 Web 函数，所以针对文件上传，不在需要进行 `Base64` 编码了，直接把文件内容作为参数传入即可。

> 注意：当前 API 网关支持上传最大文件大小为 `2M`，如果文件过大，请修改为前端直传对象存储方案。

## 代码示例

入口文件 `app.js` 如下:

```js
const multer = require('multer');
const express = require('express');
const path = require('path');

const app = express();

// Serverless 场景只能读写 /tmp 目录，所以这里需要指定上传文件的目录为 /tmp/upload
const upload = multer({ dest: '/tmp/upload' });

// Routes
app.post('/upload', upload.single('file'), (req, res) => {
  res.send({
    success: true,
    data: req.file,
  });
});
// ...

app.listen(9000, () => {
  console.log(`Server start on http://localhost:9000`);
});
```

实例代码实现了文件上传接口 `POST /upload`，如果要支持文件上传，需要安装 `multer` 包。
