# 国内访问方案（Gitee / Cloudflare / EdgeOne）

GitHub Pages 在国内（尤其是微信内置浏览器）经常慢或打不开。这里给三条路，按「省事程度 → 国内速度」排。

当前线上地址：<https://wangyanweiie.github.io/rest-calendar/>

---

## 方案 1：Gitee 镜像（你要的「挂一份到 Gitee」）

### 1.1 建仓库（网页导入，最简单，不用命令行）

1. 打开 <https://gitee.com/projects/new>，或直接用 **导入** 功能：<https://gitee.com/projects/import>
2. 选择「从 GitHub 导入」，填 `https://github.com/wangyanweiie/rest-calendar`
3. 填 Gitee 仓库名 `rest-calendar`，公开仓库（Pages 只支持公开）
4. 导入后会拉取全部文件与提交历史

> 也可以本地推：`./mirror-to-gitee.sh git@gitee.com:<你的Gitee用户名>/rest-calendar.git`

### 1.2 开启 Gitee Pages

仓库页 → **服务 → Gitee Pages** → 分支 `main`、部署目录留空 → 启动。

注意：

- 需要完成**实名认证**（个人免费版要求）
- 每次更新代码后，要回到 Pages 页面点一次「**更新**」，不会自动部署
- 地址形如 `https://<你的Gitee用户名>.gitee.io/rest-calendar/`
- 免费版可能有访问频率限制 / 内容审核

---

## 方案 2：Cloudflare Pages（推荐，国内可访问且自动部署）

免费、无需备案、GitHub 一改就自动重建。

1. <https://dash.cloudflare.com/> → Workers & Pages → Create → Pages → Connect to Git
2. 授权 GitHub，选中 `wangyanweiie/rest-calendar`
3. 构建设置（纯静态，全部留空）：
   - Framework preset：`None`
   - Build command：留空
   - Build output directory：`/`
4. Deploy → 得到 `https://rest-calendar.pages.dev`

之后每次 `git push` 自动重新发布，链接固定。

---

## 方案 3：腾讯云 EdgeOne Pages（国内节点最快）

- <https://edgeone.ai/zh/products/pages>，用腾讯云账号（需实名）
- 同样连接 GitHub 仓库或直接上传，得到 `*.edgeone.app` 域名
- 国内访问延迟明显低于境外托管；默认域名一般无需备案

---

## 三者对比

| | Gitee Pages | Cloudflare Pages | EdgeOne Pages |
| --- | --- | --- | --- |
| 费用 | 免费（需实名） | 免费 | 免费额度 |
| 自动部署 | ❌ 每次手动点更新 | ✅ push 即部署 | ✅ |
| 国内速度 | 快 | 中上 | 最快 |
| 备案 | 不需要 | 不需要 | 默认域名一般不需要 |
| 微信里打开 | 一般可以 | 多数可以 | 可以 |

---

## 多地址并存建议

如果两个都部署了，可以在页面底部「扫码打开」卡片里列出主用地址，或者对同事直接发最快的那个。
二维码可以按需重新生成：

```bash
curl -o qrcode.png "https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=20&data=<新的URL>"
```
