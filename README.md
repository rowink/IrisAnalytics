<p align="center">
<img  src="docs/moe.png" alt="Logo" width="200px">
</p>

<h2 align="center">
Iris Analytics
</h2>

<p align="center">一个运行在Cloudflare的网络分析跟踪器和仪表板</p>

### 页面截图


### 部署

- 登录到 [Cloudflare Login](https://dash.cloudflare.com/sign-up)
- 点击 Workers 和 Pages 随便创建一个 workers 并开启 分析引擎，然后复制 workers ID 备用。
- 创建一个 [Cloudflare API token](https://dash.cloudflare.com/profile/api-tokens) 备用。
- Fork 此仓库 或 [使用此模板生成新仓库](https://github.com/new?template_name=HanAnalytics&template_owner=uxiaohan)
- 登录 Cloudflare 并创建 Pages 项目 ，链接Github仓库，选择刚刚 Fork 的项目，架构选择Vue，填入环境变量（环境变量含义如下），部署即可。[操作截图1](https://i0.wp.com/uxiaohan.github.io/v2/2024/09/1727001163.webp)，[操作截图2](https://i0.wp.com/uxiaohan.github.io/v2/2024/09/1727001181.webp)，[操作截图3](https://i0.wp.com/uxiaohan.github.io/v2/2024/12/1734595834412.webp)
- cloudflare pages 部署完成后，在项目的`设置`中配置`绑定`，添加`Analytics Engine`，变量名称填写`AnalyticsBinding`，数据集填写`AnalyticsDataset`并保存，重新部署！。
- 重新部署完成后，访问 `https://xxxxxx.pages.dev` 即可访问网站分析仪表板。（注意：首次部署生成的域名可能需要几分钟时间生效，请耐心等待）
- 部署成功后，首次打开页面没有数据，请尽快集成到自己的网站并出现有效访问后，再次打开页面即可看到数据！
- 新增 `密码访问` 及 `网站白名单`，开启密码后，输入密码可访问（默认无需密码），网站白名单功能，加白的网站才可计入统计（默认任意网站都可统计）

### 环境变量说明
```shell
# Cloudflare Workers ID
CLOUDFLARE_ACCOUNT_ID = 你的 Cloudflare Workers ID

# 你的 Cloudflare API token
CLOUDFLARE_API_TOKEN = 你的 Cloudflare API token

# 网站访问密码 (不设置即无需密码访问)
CLOUDFLARE_WEBSITE_PWD = 

# 可统计的白名单 格式：  域名,WebSite|域名,WebSite，多个站点使用|分隔 例如：api.vvhan.com,Hello-Han-Api|www.vvhan.com,Hello-HanHexoBlog  (不设置即允许任何统计)
CLOUDFLARE_WEBSITE_WHITELIST = 
```

### 绑定
```shell
# 变量名
AnalyticsBinding
# 数据集
AnalyticsDataset
```

### 集成使用

```js
// 在网站底部插入以下代码即可集成网站分析仪表板
<script defer src="https://xxxxxx.pages.dev/tracker.min.js" data-website-id="自定义网站唯一标识"></script>
```

### 数据问题

Cloudflare Analytics Engine 无法访问网站导致的，请确保网站被正常访问，并且保证 Cloudflare Analytics Engine 开启，并已经创建分析数据集。