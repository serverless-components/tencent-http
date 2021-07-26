## 高级配置

组件在部署 `Web` 框架应用时，默认会自动注入 `scf_bootstrap` 文件到项目中，给个框架的默认 `scf_bootstrap` 内容如下：

- express - [scf_bootstrap](../src/_shims//express/scf_bootstrap)
- koa - [scf_bootstrap](../src/_shims//koa/scf_bootstrap)
- egg - [scf_bootstrap](../src/_shims//egg/scf_bootstrap)
- nextjs - [scf_bootstrap](../src/_shims//nextjs/scf_bootstrap)
- nuxtjs - [scf_bootstrap](../src/_shims//nuxtjs/scf_bootstrap)
- nestjs - [scf_bootstrap](../src/_shims//nestjs/scf_bootstrap)
- flask - [scf_bootstrap](../src/_shims//flask/scf_bootstrap)
- django - [scf_bootstrap](../src/_shims//django/scf_bootstrap)
- laravel - [scf_bootstrap](../src/_shims//laravel/scf_bootstrap)

如果需要自定义入口文件，用户可自己在项目下编写自定义的启动命令文件 `scf_bootstrap`，自定义前请注意一下几点：

1. scf_bootstrap 文件需要可执行权限
2. 监听端口必须是 `9000`
3. 云函数的不同语言的可执行命令是定制化的，必须清楚的知道该语言的可执行文件路径，否则会导致启动失败

以下为各个语言可执行文件在云函数环境的绝对路径：

```text
Nodejs12.16 - /var/lang/node12/bin/node
Nodejs10.15 - /var/lang/node10/bin/node

Python3.6 - /var/lang/python3/bin/python3
Python2.7 - /var/lang/python2/bin/python

Php7 - /var/lang/php7/bin/php
Php5 - /var/lang/php5/bin/php

Java8 - /var/lang/java8/bin/java
```
