# Scrape2MD

**将动态网页转换为干净、适合 LLM 使用的 Markdown。**

[Read in English](README.md) | [Leer en Español](README.es.md) | [Lire en Français](README.fr.md)

---

**Scrape2MD** 是一个高性能微服务和 Web 界面，旨在弥合可视化 Web 与大型语言模型 (LLM) 之间的差距。它可以摄取复杂的、大量使用 JavaScript 的网站，去除噪音（广告、导航、脚本），并提供纯净、结构化的 Markdown 内容，非常适合 RAG（检索增强生成）、摘要和分析。

## ✨ 主要特性

*   **动态内容支持：** 由 **Playwright**以此驱动，它能成功渲染和抓取传统爬虫无法处理的单页应用 (SPA) 和重 JavaScript 网站。
*   **智能清洗：** 利用 **BeautifulSoup** 和智能启发式算法去除广告、弹窗和导航菜单等杂乱内容，只保留核心内容。
*   **LLM 优化输出：** 将 HTML 转换为干净、语义化的 Markdown（标题、列表、链接），便于 AI 处理。
*   **双重界面：** 同时提供强大的 **REST API** 供开发者使用，以及现代化的 **React Web UI** 供手动使用。
*   **元数据提取：** 自动捕获页面标题、原始/清洗后的 token 计数和优化指标。
*   **容器就绪：** 使用 Docker 完全容器化，易于部署。

## 🛠️ 技术栈

### 后端 (API)
*   **Python 3.10+**
*   **FastAPI:** 用于构建 API 的高性能 Web 框架。
*   **Playwright:** 用于可靠渲染的无头浏览器自动化工具。
*   **BeautifulSoup4:** HTML 解析和清洗。
*   **Markdownify:** HTML 转 Markdown。

### 前端 (Web UI)
*   **React 18** (使用 **TypeScript**)
*   **Vite:** 下一代前端工具。
*   **Tailwind CSS:** 实用优先的 CSS 框架，用于样式设计。
*   **Lucide React:** 美观且一致的图标。

## 🚀 快速开始

### 先决条件
*   **Python 3.10** 或更高版本
*   **Node.js 18** 或更高版本
*   **Git**

### 1. 后端设置 (API)

进入后端目录：
```bash
cd scrape2md
```

创建并激活虚拟环境：
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

安装依赖项和浏览器二进制文件：
```bash
pip install -r requirements.txt
playwright install chromium
```

启动 API 服务器：
```bash
python -m uvicorn app.main:app --reload
```
*API 将在 `http://localhost:8000` 上可用*

### 2. 前端设置 (Web UI)

打开一个新的终端并进入前端目录：
```bash
cd scrape2md_website
```

安装 Node 依赖项：
```bash
npm install
```

启动开发服务器：
```bash
npm run dev
```
*Web UI 将在 `http://localhost:3000` 上可用*

## 📖 使用说明

### Web 界面
1.  在浏览器中打开 `http://localhost:3000`。
2.  将您想要转换的 URL 粘贴到输入框中。
3.  (可选) 点击 **Config** 设置需要等待的特定 CSS 选择器（适用于加载较慢的网站）或切换图片包含选项。
4.  点击 **Execute**。
5.  在 "Preview" 标签页查看结果，或从 "Code" 标签页复制原始内容。

### API 使用
您可以使用 `curl` 或任何 HTTP 客户端直接调用抓取服务。

**Endpoint:** `POST /scrape`

**请求:** 
```bash
curl -X POST http://127.0.0.1:8000/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "wait_for_selector": "body",
    "include_images": false
  }'
```

**响应:** 
```json
{
  "url": "https://example.com",
  "title": "Example Domain",
  "markdown_content": "# Example Domain\n\nThis domain is for use in illustrative examples...",
  "metadata": {
    "original_length": 1200,
    "cleaned_length": 450
  }
}
```
