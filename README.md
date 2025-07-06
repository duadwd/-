# 高中英语作文修改助手

一个基于AI的高中英语作文修改网站，支持文本输入和图片上传，采用苹果风格设计。

## 功能特点

- 🎯 **双模式输入**：支持文本直接输入和图片上传
- 🤖 **多AI支持**：内置Gemini API支持，同时兼容OpenAI格式API
- 🎨 **苹果风格设计**：简洁优雅的界面设计
- 💡 **智能分析**：详细的错误分析和修改建议
- 🔍 **思考过程展示**：可折叠显示AI的分析思路
- 📋 **一键复制**：方便复制修改建议

## 技术栈

- **运行时**: Deno
- **前端**: 原生HTML/CSS/JavaScript
- **设计**: 苹果风格UI
- **API**: Gemini API / OpenAI兼容API

## 快速开始

### 环境要求

- Deno 1.40+

### 安装与运行

1. 克隆项目
```bash
git clone <repository-url>
cd 英语作文
```

2. 设置环境变量（可选）
```bash
# 如果要使用服务器端的Gemini API密钥
export GEMINI_API_KEY=your_gemini_api_key
```

3. 启动服务器
```bash
# 开发模式（支持热重载）
deno task dev

# 生产模式
deno task start
```

4. 访问网站
```
http://localhost:8000
```

## API配置说明

### Gemini API（推荐）

- **内置支持**：无需额外配置即可使用
- **可选API Key**：可以在界面中输入自己的API Key，或使用服务器配置的Key
- **支持模型**：
  - Gemini 1.5 Flash（快速响应）
  - Gemini 1.5 Pro（更准确，推荐）

### OpenAI兼容API

支持任何兼容OpenAI格式的API服务：

- **API地址**：默认为 `https://api.openai.com`，可修改为其他兼容服务
- **API Key**：必须提供有效的API Key
- **模型选择**：自动加载可用模型列表

## 使用指南

### 文本输入模式

1. 选择"文本输入"标签
2. 在文本框中输入或粘贴英语作文
3. 配置API（可选）
4. 点击"开始修改"

### 图片上传模式

1. 选择"图片上传"标签
2. 点击上传区域或拖拽图片
3. 支持JPG、PNG格式
4. 配置API（可选）
5. 点击"开始修改"

### 查看修改结果

- **思考过程**：点击展开查看AI的分析思路
- **修改建议**：按类别显示具体的修改内容
- **原文对比**：黄色背景显示原文，蓝色背景显示修改后的内容
- **详细解释**：每个修改都有详细的解释说明

## 项目结构

```
英语作文/
├── deno.json          # Deno配置文件
├── main.ts            # 服务器主文件
├── index.html         # 前端页面
├── style.css          # 样式文件
├── app.js             # 前端逻辑
└── README.md          # 项目说明
```

## API格式说明

### Gemini API格式
- 生成内容: `/v1beta/models/{model}:generateContent`
- 获取模型列表: `/v1beta/models`

### OpenAI API格式
- 生成内容: `/v1/chat/completions`
- 获取模型列表: `/v1/models`

## 开发说明

### 添加新功能

1. 修改 `app.js` 添加前端逻辑
2. 修改 `style.css` 添加样式
3. 如需后端支持，修改 `main.ts`

### 自定义提示词

在 `app.js` 中的 `processWithGemini` 和 `processWithOpenAI` 函数中修改提示词模板。

## 注意事项

- 图片上传大小建议不超过5MB
- 作文长度建议在100-500词之间
- API调用可能产生费用，请注意使用额度
- 建议使用Chrome、Safari等现代浏览器

## 部署到 Deno Deploy

### 方法一：通过 GitHub 自动部署（推荐）

1. **Fork 或上传项目到 GitHub**
   - 将项目代码上传到您的 GitHub 仓库

2. **登录 Deno Deploy**
   - 访问 [https://deno.com/deploy](https://deno.com/deploy)
   - 使用 GitHub 账号登录

3. **创建新项目**
   - 点击 "New Project"
   - 选择您的 GitHub 仓库
   - 选择分支（通常是 main 或 master）

4. **配置部署**
   - **Entry point**: `main.ts`
   - **Install step**: 留空（不需要）
   - **Build step**: 留空（不需要）

5. **设置环境变量**
   - 在 "Environment Variables" 部分
   - 添加 `GEMINI_API_KEY`（如果需要服务器端API密钥）
   - 点击 "Add Variable"

6. **部署**
   - 点击 "Deploy Project"
   - 等待部署完成，获得项目URL

### 方法二：使用 Deno Deploy CLI

1. **安装 deployctl**
   ```bash
   deno install --allow-all --no-check -r -f https://deno.land/x/deploy/deployctl.ts
   ```

2. **登录 Deno Deploy**
   ```bash
   deployctl login
   ```

3. **部署项目**
   ```bash
   # 使用环境变量
   deployctl deploy --project=your-project-name --env=GEMINI_API_KEY=your_key main.ts
   
   # 或者不使用环境变量（用户需在界面输入API Key）
   deployctl deploy --project=your-project-name main.ts
   ```

### 方法三：使用 GitHub Actions 自动部署

1. **创建 `.github/workflows/deploy.yml`**
   ```yaml
   name: Deploy to Deno Deploy
   
   on:
     push:
       branches: [main]
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       
       steps:
         - uses: actions/checkout@v3
         
         - uses: denoland/deployctl@v1
           with:
             project: your-project-name
             entrypoint: main.ts
             # 可选：如果需要设置环境变量
             # env: |
             #   GEMINI_API_KEY=${{ secrets.GEMINI_API_KEY }}
   ```

2. **设置 GitHub Secrets**
   - 在仓库设置中添加 `DENO_DEPLOY_TOKEN`
   - 可选：添加 `GEMINI_API_KEY`

### 部署注意事项

1. **环境变量**
   - `PORT`: Deno Deploy 会自动设置，无需手动配置
   - `GEMINI_API_KEY`: 可选，如果不设置，用户需要在界面中输入

2. **静态文件**
   - 确保所有静态文件（HTML、CSS、JS）都在项目根目录
   - Deno Deploy 会自动处理静态文件服务

3. **API 代理**
   - Gemini API 代理功能正常工作
   - OpenAI 兼容 API 代理功能正常工作

4. **性能优化**
   - Deno Deploy 提供全球边缘节点
   - 自动 HTTPS 支持
   - 零冷启动时间

### 部署后验证

1. 访问部署的 URL
2. 测试文本输入功能
3. 测试图片上传功能
4. 验证 API 调用是否正常

### 常见问题

**Q: 部署后 API 调用失败？**
- 检查是否正确设置了 `GEMINI_API_KEY` 环境变量
- 确认 API Key 是否有效

**Q: 静态文件 404 错误？**
- 确保文件路径正确
- 检查 `main.ts` 中的静态文件服务逻辑

**Q: 如何查看部署日志？**
- 在 Deno Deploy 控制台查看实时日志
- 使用 `console.log` 调试

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！