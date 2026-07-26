<p align="center">
<img  src="docs/moe.png" alt="Logo" width="200px">
</p>

<h2 align="center">
Iris Analytics
</h2>

<p align="center">一个运行在 Cloudflare Pages + Analytics Engine 上的轻量开源网站分析仪表板</p>

<p align="center">
  <a href="https://iris.exi.software/">Demo</a> ·
  <a href="https://exi.ink/posts/cloudflare-page%E9%83%A8%E7%BD%B2iris-analytics%E7%BD%91%E7%AB%99%E5%88%86%E6%9E%90/">部署教程</a>
</p>

## 介绍

Iris Analytics 是基于 [HanAnalytics](https://github.com/uxiaohan/HanAnalytics) 重构的网站分析工具，提供更清晰直观的数据总览和更好的使用体验。

无需自建数据库，完全依托 Cloudflare 生态：
- **Pages** — 托管前端与 API（Pages Functions）
- **Workers Analytics Engine** — 时序数据库存储分析数据

### 部署

- 登录到 [Cloudflare](https://dash.cloudflare.com/)
- 在 Workers 和 Pages 页面，复制 workers ID 备用。
- 在 Analytics Engine 中创建数据集，名称填写`AnalyticsBinding`，数据集填写`AnalyticsDataset`
- 创建一个账户分析读取权限的 [Cloudflare API](https://dash.cloudflare.com/profile/api-tokens) 备用。
- Fork 此仓库 或 [使用此模板生成新仓库](https://github.com/new?template_name=HanAnalytics&template_owner=uxiaohan)
- 创建 Cloudflare Pages 项目，选择刚刚 Fork 的项目，架构选择Vue，填入环境变量，完成部署。
- 在项目 Pages 的`设置`中配置`绑定`，添加`Analytics Engine`，变量名称填写`AnalyticsBinding`，数据集填写`AnalyticsDataset`并保存，重新部署。
- 重新部署完成后，访问 `https://xxxxxx.pages.dev` 即可访问网站分析仪表板。
- 在 设置 > 集成工具 中获取追踪脚本，添加到站点。
- 回到总览页面，等待访问数据生成。

### 环境变量

| 变量名 | 说明 | 必填 |
|---|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Workers ID | 是 |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token（账户分析读取权限） | 是 |
| `CLOUDFLARE_WEBSITE_PWD` | 网站访问密码，留空则无需密码 | 否 |
| `CLOUDFLARE_WEBSITE_WHITELIST` | 可统计的白名单，格式 `WebsiteID \| 域名`，每行一条规则。例如：`website-id \| domain.com` | 否 |

### 绑定分析引擎
```shell
# 变量名
AnalyticsBinding
# 数据集
AnalyticsDataset
```

### 追踪脚本

```js
// 在网站底部插入以下代码即可集成网站分析仪表板
<script defer src="https://xxxxxx.pages.dev/tracker.min.js" data-website-id="自定义网站唯一标识"></script>
```

### 网站白名单

默认分析 API 公开，任何网站都可以向数据集中写入数据。通过白名单可以双向校验，防止数据被污染。

```shell
# 格式：WebsiteID | 域名，每行一条规则
CLOUDFLARE_WEBSITE_WHITELIST =
website-id | domain.com
iris | iris.exi.software
```

> 白名单同时校验网站唯一 ID 和域名，确保只有指定的网站可以上报数据。


### 登录授权

默认无登录密码，增加登录密码后，访问分析主页需要输入登录密码

```shell
# 设置后访问仪表板需输入密码（默认无需密码）
CLOUDFLARE_WEBSITE_PWD = your_password
```

登录授权有效期为 7 天，有效期内访问会自动滚动续期。

### 鸣谢

- [HanAnalytics](https://github.com/uxiaohan/HanAnalytics)

### 许可证

项目基于 MIT 授权