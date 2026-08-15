<p align="center">
<img src="docs/moe.png" alt="Iris Analytics" width="200px">
</p>

<h2 align="center">Iris Analytics</h2>

<p align="center">一个运行在 Cloudflare Pages + Analytics Engine 上的轻量开源网站分析仪表板</p>

<p align="center">
  <a href="https://iris.exi.software/">线上演示</a> ·
  <a href="#部署">部署文档</a> ·
  <a href="https://exi.ink/posts/cloudflare-page%E9%83%A8%E7%BD%B2iris-analytics%E7%BD%91%E7%AB%99%E5%88%86%E6%9E%90/">部署教程</a>
</p>

<p align="center">
  <a href="README.md">English</a>
</p>

## 介绍

Iris Analytics 是基于 [HanAnalytics](https://github.com/uxiaohan/HanAnalytics) 重构的网站分析工具，提供更清晰直观的数据总览和更好的使用体验。

无需自建数据库，完全依托 Cloudflare 生态：
- **Pages** — 托管前端与 API（Pages Functions）
- **Workers Analytics Engine** — 时序数据库存储分析数据

## 前置准备

- 登录 [Cloudflare](https://dash.cloudflare.com/)
- Cloudflare Account ID（在 Workers 和 Pages 页面获取）
- 具有账户分析读取权限的 [Cloudflare API Token](https://dash.cloudflare.com/profile/api-tokens)
- 在 Analytics Engine 中创建数据集，变量名称填写 `AnalyticsBinding`，数据集名称填写 `AnalyticsDataset`

## 部署

1. Fork 此仓库或 [使用此模板生成新仓库](https://github.com/new?template_name=HanAnalytics&template_owner=uxiaohan)
2. 创建 Cloudflare Pages 项目，选择 Fork 的项目，架构选择 **Vue**，填入[环境变量](#环境变量)，完成部署
3. 在项目 Pages 的 **设置 > 绑定** 中配置 **Analytics Engine**，变量名称填写 `AnalyticsBinding`，数据集填写 `AnalyticsDataset`，保存后重新部署
4. 访问 `https://你的项目.pages.dev` 进入网站分析仪表板
5. 在 **设置 > 集成工具** 中获取追踪脚本，添加到站点
6. 回到总览页面，等待访问数据生成

### 环境变量

| 变量名                         | 说明                                                                                       | 必填 |
| ------------------------------ | ------------------------------------------------------------------------------------------ | ---- |
| `CLOUDFLARE_ACCOUNT_ID`        | Cloudflare Account ID                                                                      | 是   |
| `CLOUDFLARE_API_TOKEN`         | Cloudflare API Token（账户分析读取权限）                                                   | 是   |
| `CLOUDFLARE_WEBSITE_PWD`       | 仪表板访问密码，留空则无需密码                                                             | 否   |
| `CLOUDFLARE_WEBSITE_WHITELIST` | 统计白名单，格式 `WebsiteID \| 域名`，支持换行或逗号分隔。例如：`website-id \| domain.com` | 否   |

### Analytics Engine 绑定

```shell
# 变量名
AnalyticsBinding
# 数据集
AnalyticsDataset
```

### 追踪脚本

在网站底部插入以下代码即可集成网站分析：

```html
<script defer src="https://你的项目.pages.dev/tracker.min.js" data-website-id="自定义网站唯一标识"></script>
```

## 网站白名单

默认分析 API 公开，任何网站都可以向数据集中写入数据。通过白名单可以双向校验网站唯一 ID 和域名，防止数据被污染。

```shell
# 推荐写法：逗号分隔（单行），避免 Cloudflare 环境变量 UI 吞掉换行
CLOUDFLARE_WEBSITE_WHITELIST = website-id | domain.com, iris | iris.exi.software
```

也可以使用换行分隔（每行一条规则，或每行以逗号结尾的混合写法，均可正常解析），因为 Cloudflare 的页面可能变动，有可能会丢失换行不好二次修改，所以并不推荐这种配置方式。如果使用，建议在规则末尾加上逗号。

```shell
# 格式：WebsiteID | 域名，换行分隔
CLOUDFLARE_WEBSITE_WHITELIST =
website-id | domain.com
iris | iris.exi.software
...

# 格式：WebsiteID | 域名，混合换行分隔
CLOUDFLARE_WEBSITE_WHITELIST =
website-id | domain.com,
iris | iris.exi.software,
...
```

白名单同时校验网站唯一 ID 和域名，确保只有指定的网站可以上报数据。

## 登录授权

设置 `CLOUDFLARE_WEBSITE_PWD` 环境变量后，访问分析主页需输入密码。登录授权有效期为 7 天，有效期内访问会自动滚动续期。

```shell
# 设置后访问仪表板需输入密码（默认无需密码）
CLOUDFLARE_WEBSITE_PWD = your_password
```

## 致谢

- [HanAnalytics](https://github.com/uxiaohan/HanAnalytics)

## 许可证

项目基于 [MIT](LICENSE) 协议开放源代码。
