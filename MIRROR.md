# 国内访问方案

> **结论先说**：Gitee Pages 已经**停止服务**（个人版入口已从「服务」菜单移除，官方 issue 明确写着「功能已下线」），
> 所以 Gitee 只能用来**存代码**，没法再托管网页。国内能跑静态站的免费方案见下面。

当前线上：
- **主地址（Netlify，微信推荐）**：<https://rest-calendar.netlify.app/>
- 备用（GitHub Pages）：<https://wangyanweiie.github.io/rest-calendar/>
Gitee 代码镜像：<https://gitee.com/wangyanweiie/rest-calendar>

---

## 一、Gitee 能做什么 / 不能做什么

| 能力 | 状态 |
| --- | --- |
| 托管 Git 仓库（代码备份、国内 clone 快） | ✅ 可用 |
| Gitee Pages 静态站点 | ❌ 已下线（见 <https://gitee.com/oschina/git-osc/issues/I9K1AZ>） |
| raw 文件直接访问 HTML | ❌ 返回 451（防钓鱼拦截） |

所以 Gitee 仓库已经同步好了，但访问地址还得靠别的托管。

同步方式（已配置）：

```bash
# 本地已有 gitee remote
git push gitee main
```

---

## 二、可用的国内访问方案

### 方案 A：Cloudflare Pages（推荐）

免费、**免实名、免备案**、GitHub 一 push 就自动部署。

1. <https://dash.cloudflare.com/sign-up> 用 GitHub 账号一键注册（1 分钟）
2. Workers & Pages → Create → Pages → Connect to Git → 选 `wangyanweiie/rest-calendar`
3. 构建配置（纯静态，全部留空）：
   - Framework preset：`None`
   - Build command：留空
   - Build output directory：`/`
4. Deploy → 得到 `https://rest-calendar.pages.dev`
5. 之后每次 `git push` 自动重新部署

实测本机访问 `pages.dev` 约 1.1s，微信内置浏览器可正常打开。

### ✅ 方案 B：Netlify（已采用）

> 已用 Netlify Drop 部署：<https://rest-calendar.netlify.app/>
>
> 更新线上时**不要**在 Netlify 后台 Link repository。连上之后每次 `git push` 都会自动部署，一次约 15 积分。
> 需要发布时，打开 GitHub → Actions → **Deploy to Netlify** → **Run workflow**。

免费、免实名、免备案。发布方式：

- **手动**：GitHub Actions 里运行 `Deploy to Netlify`（仓库需配置 `NETLIFY_AUTH_TOKEN`、`NETLIFY_SITE_ID`）
- **拖拽**：打开 <https://app.netlify.com/drop>，把项目文件夹拖进去（同样会扣积分，且不会跟随后续提交）

域名形如 `https://xxx.netlify.app`，国内一般可访问。

### 方案 C：腾讯云 EdgeOne Pages（国内最快）

- <https://edgeone.ai/zh/products/pages>，需要腾讯云账号 + 实名认证
- 支持连接 GitHub 仓库或直接上传
- 国内节点，延迟最低；默认域名一般无需备案
- 适合"同事都在国内、天天要看"的场景

### 方案 D：Vercel

免费、连 GitHub 自动部署，但 `*.vercel.app` 域名在国内移动网络下经常被墙，**不推荐**做主力。

### 方案 E：对象存储（OSS / COS）

阿里云 OSS、腾讯云 COS 都能开静态网站，但：

- 默认域名访问 HTML 会**强制下载**
- 想正常浏览必须绑定**已备案**的自定义域名

除非你已经有备案域名，否则不如 A/B/C。

---

## 三、对比

| | Cloudflare Pages | Netlify | EdgeOne Pages | Vercel |
| --- | --- | --- | --- | --- |
| 费用 | 免费 | 免费 | 免费额度 | 免费 |
| 实名/备案 | 都不需要 | 都不需要 | 需腾讯云实名 | 不需要 |
| 自动部署 | ✅ | 手动 | ✅ | ✅ |
| 国内速度 | 中上 | 中 | 最快 | 差 |
| 微信里打开 | 多数可以 | 一般可以 | 可以 | 经常不行 |

---

## 四、多地址并存

部署好后，把页面底部「扫码打开」卡片与 `public/qrcode.png` 换成最快的地址即可，二维码重新生成：

```bash
curl -o public/qrcode.png "https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=20&data=<新地址>"
```

然后 `git push origin main && git push gitee main`。
