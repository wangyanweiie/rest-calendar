# 部署

页面已改为 Vue + Vite。本地先 `npm install && npm run build`，发布目录是 `dist/`，不要再把源码目录直接拖到 Netlify。

GitHub Pages：Settings → Pages → Source 选 **GitHub Actions**。之后 push 到 `main` 会自动更新备用地址，不消耗 Netlify 积分。

Netlify：Actions 里手动运行 **Deploy to Netlify**（工作流会先构建再部署 `dist`）。

---

# 部署到 GitHub Pages（微信可直接打开）

**当前状态：已部署 ✅**

本地是 Vue + Vite 项目。发布前要 `npm run build`，把 `dist/` 作为站点目录。直接上传源码目录不会得到可打开的页面。

> ⚠️ 补充：Gitee Pages 已停止服务（个人版入口已下线），Gitee 仅作代码镜像，不能再托管网页。
> 国内访问请用 Cloudflare Pages / Netlify / EdgeOne Pages，详见 [MIRROR.md](MIRROR.md)。

- 仓库：<https://github.com/wangyanweiie/rest-calendar>
- 线上地址：<https://wangyanweiie.github.io/rest-calendar/>
- Pages 源：GitHub Actions（`.github/workflows/pages.yml` 构建 `dist/` 后发布）


仓库已经在本地初始化并完成首次提交（分支 `main`），只差「推到 GitHub + 打开 Pages」。

---

## 方式 A：网页建仓 + 本地推送（最简单，不需要装工具）

### 1. 建仓库

打开 <https://github.com/new>：

- Repository name：`rest-calendar`（随意，建议全小写英文）
- 可见性：**Public**（Free 账号的 Pages 只支持公开仓库）
- **不要**勾选 Add a README / .gitignore / license（本地已有文件，避免冲突）
- 点 Create repository

### 2. 推送代码

在终端执行（把 `<你的用户名>` 换成 GitHub 用户名）：

```bash
cd /Users/lemon/Documents/deepseek-harness/default-workspace/calendar
git remote add origin https://github.com/<你的用户名>/rest-calendar.git
git push -u origin main
```

弹出账号密码时：

- 用户名：GitHub 用户名
- 密码：**Personal Access Token**（不是登录密码）。生成入口：
  <https://github.com/settings/tokens> → Generate new token (classic) → 勾选 `repo` → 复制 `ghp_...` 当作密码粘贴。

### 3. 打开 Pages

仓库页 → **Settings → Pages**：

- Source：`Deploy from a branch`
- Branch：`main` / 目录 `/ (root)`
- Save

等 1～2 分钟，访问：

```
https://<你的用户名>.github.io/rest-calendar/
```

### 4. 微信分享

把这个链接发到微信聊天，点开即可（iPhone 上微信内置浏览器能正常渲染）。
建议在微信里点右上角「···」→「在 Safari 中打开」，导出 .ics、翻页体验更完整。

---

## 方式 B：Cloudflare Pages（国内微信更稳，推荐配合 A 一起用）

`github.io` 在国内部分网络下会打不开或被微信拦截。同一份仓库接到 Cloudflare Pages 后，
可以拿到 `xxx.pages.dev` 域名，国内访问通常稳定得多，且免费、不需要备案。

1. 先完成方式 A 的第 1、2 步（代码到 GitHub）
2. 打开 <https://dash.cloudflare.com/> → Workers & Pages → Create → Pages → Connect to Git
3. 选择刚才的仓库，构建设置留空（纯静态）：
   - Framework preset：`None`
   - Build command：留空
   - Build output directory：`/`
4. Deploy，得到 `https://<项目名>.pages.dev`

以后每次 `git push`，Cloudflare 会自动重新部署。

---

## 方式 C：Vercel / Netlify（同上，任选其一）

- Vercel：<https://vercel.com/new> → Import Git Repository → Framework: Other → 直接 Deploy
- Netlify：不要用 Import from Git（每次 push 都会部署并扣积分）。需要更新时，到仓库 Actions 页手动运行 **Deploy to Netlify**。

也可以把项目文件夹拖进 <https://app.netlify.com/drop>，但那是一次性快照，同样消耗积分。

---

## 微信里的注意事项

| 现象 | 原因 / 处理 |
| --- | --- |
| 点开提示「已停止访问该网页」 | 国内对 `github.io` 偶有限制 → 换 Cloudflare Pages / Vercel 域名 |
| 页面能开但很慢 | 同上，换境外 CDN 域名；或让同事「在浏览器打开」 |
| 导出 .ics 无反应 | 微信内置浏览器禁下载 → 右上角「···」→「在 Safari 中打开」 |
| 想加到主屏幕 | Safari 打开 → 分享 → 添加到主屏幕，之后像 App 一样点开 |

---

## 部署后自检清单

- [ ] `https://<域名>/` 能打开（index.html 是入口）
- [ ] 月份左右切换正常，今天（2026-11-09）有高亮
- [ ] 红色格子 = 休息日撞周末；金色「法定」= 法定节假日
- [ ] 点日期有详情条；「全年 2027」「只到春节」按钮生效
- [ ] iPhone 竖屏下无横向滚动

---

## 本地预览（可选）

```bash
cd /Users/lemon/Documents/deepseek-harness/default-workspace/calendar
python3 -m http.server 8088
# 或直接双击 index.html
```
