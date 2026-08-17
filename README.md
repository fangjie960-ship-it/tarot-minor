# 小阿尔卡纳 · 三张牌

纯静态塔罗抽牌网页：选择主题，随机抽取三张小阿尔卡纳，点击翻牌查看正逆位和主题相关解读。

## 本地预览

直接双击打开 `index.html` 即可，无需安装依赖。

## 部署

1. 把整个 `tarot-minor` 文件夹推送到 GitHub 仓库。
2. 在 Vercel 中导入该仓库。
3. 框架选择 Static / 无框架，构建命令留空，输出目录保持根目录。

## AI 解读（可选）

翻完三张牌后可以点击「AI 解读」。前端只把抽牌结果和可选文字说明发给 `/api/reading`，API key 只存在于服务端环境变量中，不会出现在网页代码里。

需要设置三个环境变量：

- `AI_API_KEY`：模型服务商的 API key
- `AI_BASE_URL`：兼容 OpenAI 格式的接口地址，例如 DeepSeek 为 `https://api.deepseek.com/v1`，OpenAI 为 `https://api.openai.com/v1`
- `AI_MODEL`：模型名，例如 `deepseek-chat` 或 `gpt-4o-mini`

Cloudflare Pages 在项目 Settings -> Environment variables 中设置，Vercel 在项目 Settings -> Environment Variables 中设置。

## 图片版权

牌面来自 Wikimedia Commons 的 Vectorized Tarot by Immanuelle，原作由 Pamela Colman Smith 绘制，属于公有领域。
