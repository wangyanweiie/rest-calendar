#!/usr/bin/env bash
# 把当前仓库镜像到 Gitee
# 用法：./mirror-to-gitee.sh git@gitee.com:<你的Gitee用户名>/rest-calendar.git
set -euo pipefail

REMOTE="${1:-}"
if [ -z "$REMOTE" ]; then
  echo "用法: $0 git@gitee.com:<用户名>/rest-calendar.git"
  echo "   或: $0 https://gitee.com/<用户名>/rest-calendar.git"
  exit 1
fi

git remote get-url gitee >/dev/null 2>&1 \
  && git remote set-url gitee "$REMOTE" \
  || git remote add gitee "$REMOTE"

echo "→ 推送到 Gitee: $REMOTE"
git push gitee main
echo "✔ 完成。Gitee 仓库地址: ${REMOTE%.git}"
