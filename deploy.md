## 发布文档

修改代码后，只需要执行如下命令部署：

```bash
$ npm run deploy
```

部署的组件版本将依赖项目根目录 `version.yml` 中的 `version` 字段。

也可以通过命令行指定版本：

```bash
$ npm run deploy --version=1.0.0
```
