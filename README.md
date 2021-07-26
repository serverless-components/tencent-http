## 腾讯云 HTTP 框架组件

通过使用 [Tencent Serverless](https://github.com/serverless/components/tree/cloud)，基于云上 Serverless 服务（如网关、云函数等），实现便捷开发，极速部署你的 Web 框架应用，组件支持丰富的配置扩展，提供了目前最易用、低成本并且弹性伸缩的 Web 框架项目开发/托管能力。

特性介绍：

- [x] **按需付费** - 按照请求的使用量进行收费，没有请求时无需付费
- [x] **极速部署** - 仅需几秒，部署你的整个 Web 框架应用。
- [x] **实时日志** - 通过实时日志的输出查看业务状态，便于直接在云端开发应用。
- [x] **云端调试** - 针对 Node.js 框架支持一键云端调试能力，屏蔽本地环境的差异。
- [x] **便捷协作** - 通过云端的状态信息和部署日志，方便的进行多人协作开发。
- [x] **自定义域名** - 支持配置自定义域名及 HTTPS 访问

## 示例代码

项目 [examples](./examples) 目录下存放了支持框架的实例代码，可以之类进入到指定框架目录执行部署

## 快速开始

1. [**安装**](#1-安装)
2. [**创建**](#2-创建)
3. [**配置**](#3-配置)
4. [**部署**](#4-部署)
5. [**查看状态**](#5-查看状态)
6. [**移除**](#6-移除)

更多资源：

- [**架构说明**](#架构说明)
- [**账号配置**](#账号配置)

### 1. 安装

通过 npm 安装最新版本的 Serverless CLI

```bash
$ npm install -g serverless
```

> 注意：如果项目目录下存在 `sls.js`，`Windows` 系统会默认执行 `sls.js` 脚本文件，此时建议 `Windows` 用户不要使用 `sls` 简写命令。

### 2. 创建项目

快速创建一个 Express 应用：

```bash
$ mkdir serverless-express
$ cd serverless-express
```

新建 `app.js` 文件：

```js
const express = require('express');
const path = require('path');
const app = express();

// Routes
app.get(`/`, (req, res) => {
  res.send([
    {
      title: 'serverless framework',
      link: 'https://serverless.com',
    },
  ]);
});

app.listen(9000, () => {
  console.log(`Server start on http://localhost:9000`);
});
```

安装 `express` 依赖：

```bash
$ npm install express --save
```

### 3. 配置

在项目根目录添加配置文件 `serverless.yml`，如下所示：

```yml
# serverless.yml
component: http
name: expressDemo

inputs:
  src:
    src: ./
  region: ap-guangzhou
  faas:
    framework: express
    name: expressDemo
  apigw:
    protocols:
      - http
      - https
```

点此查看[全量配置及配置说明](./docs/configure.md)

### 4. 部署

在 `serverless.yml` 文件所在的项目根目录，运行以下指令进行部署：

```bash
$ sls deploy
```

部署时需要进行身份验证，如您的账号未 [登陆](https://cloud.tencent.com/login) 或 [注册](https://cloud.tencent.com/register) 腾讯云，您可以直接通过 `微信` 扫描命令行中的二维码进行授权登陆和注册。

> 注意: 如果希望查看更多部署过程的信息，可以通过 `sls deploy --debug` 命令查看部署过程中的实时日志信息。

部署完成后，控制台会打印相关的输出信息，您可以通过 `${output:${stage}:${app}:apigw.url}` 的形式在其他 `serverless` 组件中引用该组件的 API 网关访问链接（或通过类似的形式引用该组建其他输出结果），具体的，可以查看完成的输出文档：

- [点击此处查看输出文档](./docs/output.md)

### 5. 查看状态

在`serverless.yml`文件所在的目录下，通过如下命令查看部署状态：

```
$ serverless info
```

### 6. 移除

在`serverless.yml`文件所在的目录下，通过以下命令移除部署的 Express 服务。移除后该组件会对应删除云上部署时所创建的所有相关资源。

```
$ serverless remove
```

和部署类似，支持通过 `serverless remove --debug` 命令查看移除过程中的实时日志信息。

## 架构说明

Web 框架组件将在腾讯云账户中使用到如下 Serverless 服务：

- [x] **API 网关** - API 网关将会接收外部请求并且转发到 SCF 云函数中。
- [x] **SCF 云函数** - 云函数将承载 Web 框架应用。
- [x] **CAM 访问控制** - 该组件会创建默认 CAM 角色用于授权访问关联资源。
- [x] **COS 对象存储** - 为确保上传速度和质量，云函数压缩并上传代码时，会默认将代码包存储在特定命名的 COS 桶中。
- [x] **SSL 证书服务** - 如果你在 yaml 文件中配置了 `apigw.customDomains` 字段，需要做自定义域名绑定并开启 HTTPS 时，也会用到证书管理服务和域名服务。Serverless Framework 会根据已经备案的域名自动申请并配置 SSL 证书。

## 账号配置

当前默认支持 CLI 扫描二维码登录，如您希望配置持久的环境变量/秘钥信息，也可以本地创建 `.env` 文件

```console
$ touch .env # 腾讯云的配置信息
```

在 `.env` 文件中配置腾讯云的 SecretId 和 SecretKey 信息并保存

如果没有腾讯云账号，可以在此[注册新账号](https://cloud.tencent.com/register)。

如果已有腾讯云账号，可以在[API 密钥管理](https://console.cloud.tencent.com/cam/capi)中获取 `SecretId` 和`SecretKey`.

```
# .env
TENCENT_SECRET_ID=123
TENCENT_SECRET_KEY=123
```

## License

MIT License

Copyright (c) 2020 Tencent Cloud, Inc.
