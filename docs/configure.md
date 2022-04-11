# 配置文档

## 全部配置

```yml
# serverless.yml
component: http # (必选) 组件名称
name: webDemo # 必选) 组件实例名称.

inputs:
  region: ap-guangzhou # 云函数所在区域
  src: # 部署src下的文件代码，并打包成zip上传到bucket上
    src: ./ # 本地需要打包的文件目录
    exclude: # 被排除的文件或目录
      - .env
      - 'node_modules/**'
  # src: # 在指定存储桶bucket中已经存在了object代码，直接部署
  #   bucket: bucket01 # bucket name，当前会默认在bucket name后增加 appid 后缀, 本例中为 bucket01-appid
  #   object: cos.zip  # bucket key 指定存储桶内的文件
  faas: # 函数配置相关
    framework: express
    runtime: Nodejs12.16
    name: webDemo # 云函数名称
    timeout: 10 # 超时时间，单位秒
    memorySize: 512 # 内存大小，单位MB
    environments: #  环境变量
      - key: envKey
        value: envValue
    vpc: # 私有网络配置
      vpcId: 'vpc-xxx' # 私有网络的Id
      subnetId: 'subnet-xxx' # 子网ID
    layers:
      - name: layerName #  layer名称
        version: 1 #  版本
    tags:
      - key: tagKey
        value: tagValue
  apigw: #  # http 组件会默认帮忙创建一个 API 网关服务
    isDisabled: false # 是否禁用自动创建 API 网关功能
    id: service-xxx # api网关服务ID
    name: serverless # api网关服务ID
    api: # 创建的 API 相关配置
      cors: true #  允许跨域
      timeout: 15 # API 超时时间
      name: apiName # API 名称
      qualifier: $DEFAULT # API 关联的版本
    protocols:
      - http
      - https
    environment: test
    tags:
      - key: tagKey
        value: tagValue
    customDomains: # 自定义域名绑定
      - domain: abc.com # 待绑定的自定义的域名
        certId: abcdefg # 待绑定自定义域名的证书唯一 ID
        # 如要设置自定义路径映射，(customMap = true isDefaultMapping = false)必须两者同时出现 其余情况都是默认路径
        customMap: true
        isDefaultMapping: false
        # 自定义路径映射的路径。使用自定义映射时，可一次仅映射一个 path 到一个环境，也可映射多个 path 到多个环境。并且一旦使用自定义映射，原本的默认映射规则不再生效，只有自定义映射路径生效。
        pathMap:
          - path: /
            environment: release
        protocols: # 绑定自定义域名的协议类型，默认与服务的前端协议一致。
          - http # 支持http协议
          - https # 支持https协议
    app: #  应用授权配置
      id: app-xxx
      name: app_demo
      description: app description
  # 通常用于将文件上传至cos做备份，访问还是通过网关访问
  assets:
    cos:
      bucket: static-bucket
      sources:
        - src: public
          targetDir: /
    cdn:
      area: mainland
      domain: abc.com
      autoRefresh: true
      refreshType: delete
      forceRedirect:
        switch: on
        redirectType: https
        redirectStatusCode: 301
      https:
        http2: on
        certId: 'abc'
```

## inputs 配置参数

主要的参数

| 参数名称 | 必选 | 类型              |     默认值      | 描述              |
| -------- | :--: | :---------------- | :-------------: | :---------------- |
| region   |  否  | string            | `ap-guangzhou`  | 项目部署所在区域  |
| src      |  否  | [Src](#Src)       | `process.cwd()` | 项目代码配置      |
| faas     |  否  | [Faas](#Faas)     |                 | 函数配置          |
| apigw    |  否  | [Apigw](#Apigw)   |                 | API 网关配置      |
| assets   |  否  | [Assets](#Assets) |                 | 静态资源 CDN 配置 |

## Src

项目代码配置

| 参数名称 | 是否必选 |   类型   | 默认值 | 描述                                                                                                                                                                                 |
| -------- | :------: | :------: | :----: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| src      |    否    |  string  |        | 代码路径。与 object 不能同时存在。                                                                                                                                                   |
| exclude  |    否    | string[] |        | 不包含的文件或路径, 遵守 [glob 语法][glob]                                                                                                                                           |
| bucket   |    否    |  string  |        | bucket 名称。如果配置了 src，表示部署 src 的代码并压缩成 zip 后上传到 bucket-appid 对应的存储桶中；如果配置了 object，表示获取 bucket-appid 对应存储桶中 object 对应的代码进行部署。 |
| object   |    否    |  string  |        | 部署的代码在存储桶中的路径。                                                                                                                                                         |

### Faas

函数配置

| 参数名称     | 是否必选 | 类型                          |    默认值     | 描述                                                                            |
| ------------ | :------: | :---------------------------- | :-----------: | :------------------------------------------------------------------------------ |
| framework    |    是    | string                        |               | 项目框架名称，比如 `express`                                                    |
| runtime      |    否    | string                        | `Nodejs12.16` | 运行环境                                                                        |
| name         |    否    | string                        |               | 函数名称                                                                        |
| timeout      |    否    | number                        |     `10`      | 函数最长执行时间，单位为秒，可选值范围 1-900 秒，默认为 3 秒                    |
| memorySize   |    否    | number                        |     `512`     | 函数运行时内存大小，默认为 128M，可选范围 64、128MB-3072MB，并且以 128MB 为阶梯 |
| environments |    否    | [Environment](#Environment)[] |               | 函数的环境变量                                                                  |
| vpc          |    否    | [Vpc](#Vpc)                   |               | 函数的 VPC 配置                                                                 |
| layers       |    否    | [Layer](#Layer)[]             |               | 云函数绑定的 layer                                                              |
| tags         |    否    | [Tag](#Tag)[]                 |               | 标签配置                                                                        |

> 此处只是列举，`faas` 参数支持 [scf][scf-config] 组件的所有基础配置（ `events` 除外）

`framework` 支持的框架如下：

- [x] express
- [x] koa
- [x] egg
- [x] nextjs
- [x] nuxtjs
- [x] nestjs
- [x] flask
- [x] django
- [x] laravel
- [ ] thinkphp (暂不支持)

##### Layer

层配置

| 参数名称 | 是否必选 |  类型  | 默认值 | 描述     |
| -------- | :------: | :----: | :----: | :------- |
| name     |    否    | string |        | 层名称   |
| version  |    否    | string |        | 层版本号 |

##### Environment

环境变量

| 参数名称 | 类型   | 描述             |
| -------- | ------ | :--------------- |
| key      | string | 环境变量参数, 键 |
| value    | string | 环境变量参数, 值 |

##### Vpc

VPC 配置

| 参数名称 | 类型   | 描述        |
| -------- | ------ | :---------- |
| vpcId    | string | 私有网络 ID |
| subnetId | string | 子网 ID     |

### Apigw

API 网关配置

| 参数名称      | 是否必选 | 类型                            | 默认值       | 描述                                                             |
| ------------- | :------: | :------------------------------ | :----------- | :--------------------------------------------------------------- |
| id            |    否    | string                          |              | API 网关服务 ID, 如果存在将使用这个 API 网关服务                 |
| name          |    否    | string                          | `serverless` | API 网关服务名称, 默认创建一个新的服务名称                       |
| protocols     |    否    | string[]                        | `['http']`   | 前端请求的类型，如 http，https，http 与 https                    |
| environment   |    否    | string                          | `release`    | 发布环境. 网关环境: test, prepub 与 release                      |
| usagePlan     |    否    | [UsagePlan](#UsagePlan)         |              | 使用计划配置                                                     |
| auth          |    否    | [ApiAuth](#ApiAuth)             |              | API 密钥配置                                                     |
| customDomains |    否    | [CustomDomain](#CustomDomain)[] |              | 自定义 API 域名配置                                              |
| enableCORS    |    否    | boolean                         | `false`      | 开启跨域。默认值为否。                                           |
| isDisabled    |    否    | boolean                         | `false`      | 关闭自动创建 API 网关功能。默认值为否，即默认自动创建 API 网关。 |
| api           |    否    | [Api](#Api)                     |              | API 配置                                                         |
| tags          |    否    | [Tag](#Tag)[]                   |              | 标签配置                                                         |
| ignoreUpdate  |    否    | boolean                         | `false`      | 忽略 API 网关更新                                                |

##### Api

| 参数名称  | 是否必选 | 类型    | 默认值     | 描述                                               |
| --------- | :------: | :------ | :--------- | :------------------------------------------------- |
| name      |    否    | string  | `http_api` | 名称，校验规则：最长 50 个字符，支持 a-z，A-Z，0-9 |
| timeout   |    否    | number  | `15`       | Api 超时时间，单位: 秒，时间范围：1-1800 秒        |
| cors      |    否    | boolean | `true`     | 是否支持跨域                                       |
| qualifier |    否    | string  | `$DEFAULT` | 关联的函数版本                                     |

##### UsagePlan

使用计划配置

参考: https://cloud.tencent.com/document/product/628/14947

| 参数名称      | 是否必选 | 类型   | 描述                                                    |
| ------------- | :------: | :----- | :------------------------------------------------------ |
| usagePlanId   |    否    | string | 用户自定义使用计划 ID                                   |
| usagePlanName |    否    | string | 用户自定义的使用计划名称                                |
| usagePlanDesc |    否    | string | 用户自定义的使用计划描述                                |
| maxRequestNum |    否    | number | 请求配额总数，如果为空，将使用-1 作为默认值，表示不开启 |

##### ApiAuth

API 密钥配置

| 参数名称   | 类型   | 描述     |
| ---------- | :----- | :------- |
| secretName | string | 密钥名称 |
| secretIds  | string | 密钥 ID  |

##### CustomDomain

自定义域名配置

| 参数名称         | 是否必选 | 类型                  | 默认值 | 描述                                                                                |
| ---------------- | :------: | :-------------------- | :----: | :---------------------------------------------------------------------------------- |
| domain           |    是    | string                |        | 待绑定的自定义的域名。                                                              |
| protocol         |    否    | string[]              |        | 绑定自定义域名的协议类型，默认与服务的前端协议一致。                                |
| certId           |    否    | string                |        | 待绑定自定义域名的证书 ID，如果设置了 `protocol` 含有 https，则为必选               |
| isDefaultMapping |    否    | string                | `true` | 是否使用默认路径映射。为 `false` 时，表示自定义路径映射，此时 pathMappingSet 必填。 |
| pathMappingSet   |    否    | [PathMap](#PathMap)[] |  `[]`  | 自定义路径映射的路径。                                                              |
| isForcedHttps | 否 | boolean | `false` | 是否启用**Https**强制重定向功能 | 

> 注意：使用自定义映射时，可一次仅映射一个 path 到一个环境，也可映射多个 path 到多个环境。并且一旦使用自定义映射，原本的默认映射规则不再生效，只有自定义映射路径生效。

###### PathMap

自定义路径映射

| 参数名称    | 是否必选 | 类型   | Description                                     |
| ----------- | :------: | :----- | :---------------------------------------------- |
| path        |    是    | string | 自定义映射路径                                  |
| environment |    是    | string | 自定义映射环境，有效值：test、prepub 和 release |

### Assets

静态资源配置

| 参数名称 | 是否必选 |    类型     | 默认值 | 描述     |
| -------- | :------: | :---------: | :----: | :------- |
| cos      |    是    | [Cos](#Cos) |        | COS 配置 |
| cdn      |    否    | [Cdn](#Cdn) |        | CDN 配置 |

##### Cos

COS 配置

| 参数名称     | 是否必选 |        类型         |                  默认值                   | 描述                          |
| ------------ | :------: | :-----------------: | :---------------------------------------: | :---------------------------- |
| bucket       |    是    |       string        |                                           | COS 存储同名称                |
| sources      |    否    | [Source](#Source)[] | `[{ "src": "public", "targetDir": "/" }]` | 需要托管到 COS 的静态资源目录 |
| ignoreUpdate |    否    |       boolean       |                  `false`                  | 忽略 COS 网关更新             |

###### Source

静态资源目录配置

| 参数名称  | 是否必选 |  类型  | 默认值 | 描述                  |
| --------- | :------: | :----: | :----: | :-------------------- |
| src       |    是    | string |        | 静态资源目录          |
| targetDir |    否    | string |  `/`   | 上传到 COS 存储桶目录 |

`nextjs` 组件默认 `sources` 配置为：

```json
[
  { "src": ".next/static", "targetDir": "/_next/static" },
  { "src": "public", "targetDir": "/" }
]
```

`nuxtjs` 组件默认 `sources` 配置为：

```json
[
  { "src": ".nuxt/dist/client", "targetDir": "/_next/static" },
  { "src": "public", "targetDir": "/" }
]
```

##### Cdn

CDN 配置

area: mainland domain: cnode.yuga.chat autoRefresh: true refreshType: delete
forceRedirect: switch: on redirectType: https redirectStatusCode: 301 https:
http2: on certId: 'eGkM75xv'

| 参数名称      | 是否必选 |              类型               |   默认值   | 描述                                                       |
| ------------- | :------: | :-----------------------------: | :--------: | :--------------------------------------------------------- |
| domain        |    是    |             string              |            | CDN 域名                                                   |
| area          |    否    |             string              | `mainland` | 加速区域，mainland: 大陆，overseas：海外，global：全球加速 |
| autoRefresh   |    否    |             boolean             |   `true`   | 是否自动刷新 CDN                                           |
| refreshType   |    否    |             string              |  `delete`  | CDN 刷新类型，delete：刷新全部资源，flush：刷新变更资源    |
| forceRedirect |    否    | [ForceRedirect](#ForceRedirect) |            | 访问协议强制跳转配置                                       |
| https         |    否    |         [Https](#Https)         |            | https 配置                                                 |
| ignoreUpdate  |    否    |             boolean             |  `false`   | 忽略 CDN 更新                                              |

###### ForceRedirect

访问协议强制跳转配置

| 参数名称           | 是否必选 |  类型  | 默认值  | 描述                                                           |
| ------------------ | :------: | :----: | :-----: | :------------------------------------------------------------- |
| switch             |    是    | string |  `on`   | 访问强制跳转配置开关, on：开启，off：关闭                      |
| redirectType       |    否    | string | `https` | 访问强制跳转类型，http：强制 http 跳转，https：强制 https 跳转 |
| redirectStatusCode |    否    | number |  `301`  | 强制跳转时返回状态码，支持 301、302                            |

###### Https

HTTPS 配置

| 参数名称 | 是否必选 |  类型  | 默认值 | 描述                                  |
| -------- | :------: | :----: | :----: | :------------------------------------ |
| certId   |    是    | string |        | 腾讯云托管域名证书 ID                 |
| http2    |    是    | string |        | 是否开启 HTTP2，on： 开启，off： 关闭 |

#### Tag

标签配置

| 参数名称 | 是否必选 |  类型  | 默认值 | 描述 |
| -------- | :------: | :----: | :----: | :--- |
| key      |    是    | string |        | 键   |
| value    |    是    | string |        | 值   |

<!-- links -->

[glob]: https://github.com/isaacs/node-glob
[scf-config]: https://github.com/serverless-components/tencent-scf/tree/master/docs/configure.md
