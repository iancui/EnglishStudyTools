# LinguaStep - 英语单词 + 句子渐进式学习平台

LinguaStep 是一个基于全栈 TypeScript 开发的英语单词与渐进式句子学习系统。它针对传统背单词软件“只见孤立单词、缺乏语境链接、死背长句效率低下”的痛点，构建了：

> **核心认知学习链路：**
> 单词（音形义拼读） $\to$ 短语 $\to$ 句型骨架 $\to$ 语境完整句 $\to$ 深度理解 $\to$ 检索记忆 $\to$ 科学间隔复习

---

## 🛠️ 技术栈说明

本系统严格遵守全栈 JavaScript / TypeScript 架构规范，**不使用任何 Java、Spring Boot 或 Python**。

### 前端 (Frontend)
- **核心框架**：Vite + React / TypeScript (SPA 架构)
- **UI 设计系统**：Tailwind CSS v4 + 精致无噪视觉体系（反 AI 模板化大字号卡片留白设计）
- **语音引擎**：Web Speech API 集成（支持英音 en-GB 与美音 en-US，支持 0.75x 慢速和 1.0x 标准速播放）
- **图标系统**：Lucide Icons

### 后端 (Backend)
- **运行环境**：Node.js
- **服务端框架**：Express
- **语言**：TypeScript (TSX 实时编译运行)
- **架构模式**：分层架构（Controller $\to$ Service $\to$ Repository/Storage）

### 数据库 & ORM
- **数据库**：MySQL 8 (生产模式) / 内置高保真 JSON 内存持久化存储引擎 (即开即测开箱即用)
- **ORM**：Prisma ORM (`prisma/schema.prisma`)

---

## 📂 项目结构

```
.
├── prisma/
│   └── schema.prisma            # MySQL 8 Prisma 数据模型定义
├── src/
│   ├── api/
│   │   └── client.ts            # 前端统一 API 客户端（包含鉴权请求与拦截处理）
│   ├── backend/                 # 服务端核心分层架构
│   │   ├── controllers/         # 请求处理层（auth, word, review, sentence, dict, stats）
│   │   ├── services/            # 业务逻辑层（ReviewService, AudioService, WordService...）
│   │   ├── routes/              # Express API 路由映射
│   │   ├── middleware/          # JWT 鉴权与统一错误拦截中间件
│   │   ├── db/
│   │   │   ├── seedData.ts      # 50+ 核心单词及 10+ 渐进式句型初始种子数据
│   │   │   └── storage.ts       # 持久化存储与仓库数据抽象
│   │   └── types/               # 后端统一 TypeScript 接口规范
│   ├── components/
│   │   ├── Navbar.tsx           # 顶部单行三区契约导航栏
│   │   └── PhonicsSplitter.tsx  # 自然拼读音节拆解与单音素发音组件
│   ├── views/
│   │   ├── HomeView.tsx         # 首页今日学习仪表盘
│   │   ├── WordLearnView.tsx    # 第一阶段：学单词（大字号、音标、释义、拼读拆分）
│   │   ├── WordReviewView.tsx   # 第二阶段：背单词（中文提示，英文拼写输入）
│   │   ├── SentenceListView.tsx # 句子列表
│   │   ├── SentenceStudyView.tsx# 句子渐进式学习（步进式展开，新增词淡入高亮，成分分析）
│   │   ├── WrongWordsView.tsx   # 错词本
│   │   ├── StatisticsView.tsx   # 学习记录与艾宾浩斯复习图表
│   │   ├── DictionarySettingsView.tsx # 辞书与发音全局配置
│   │   └── AuthModal.tsx        # 注册与登录弹窗
│   ├── App.tsx                  # 前端根组件与客户端路由
│   ├── index.css                # 样式与渐进式高亮动画
│   └── main.tsx                 # 前端装载入口
├── server.ts                    # 后端服务入口（集成 Express 与 Vite 中间件）
├── .env.example                 # 环境变量模板
└── package.json                 # 依赖包及启动命令配置
```

---

## 🌟 核心功能模块

### 1. 辞书全局配置 (Dictionary Config)
- 支持 **Oxford（牛津）**、**Cambridge（剑桥）**、**Collins（柯林斯）**、**Longman（朗文）** 四大权威辞书源。
- 自由切换 **英式 (UK/DJ)** 与 **美式 (US/KK)** 音标及发音。
- 支持开启或关闭 **自然拼读音节拆分**。
- 配置保存于数据库，全局各页面自动响应。

### 2. 单词两阶段学习闭环
- **第一阶段（学单词）**：以单词为视觉焦点，展示权威音标、词性与双语释义。提供自然拼读拆解（如 `hol · i · day` $\to$ `/hɒl/ · /ɪ/ · /deɪ/`），每个音节均可独立点击点播发音。
- **第二阶段（背单词）**：采用“**中文释义提示 $\to$ 键盘主动拼写英文**”模式（杜绝选择题伪熟）。支持容忍首尾空格与大小写（`holiday`、`Holiday`、`  holiday ` 均判定正确）。
- **错误即时纠偏**：错词自动收录进错词本，并调低间隔权重。

### 3. 科学间隔复习机制 (ReviewService)
独立实现的间隔复习调度算法，严格遵循艾宾浩斯与递增间隔记忆规律：
- **第 1 次正确**：10 分钟后回顾
- **第 2 次正确**：1 天后复习
- **第 3 次正确**：3 天后复习
- **第 4 次正确**：7 天后复习
- **第 5 次正确**：15 天后复习
- **第 6 次正确**：30 天后巩固并标记为 MASTERED（已掌握）
- **回答错误**：立即降低复习间隔至 10 分钟，重置连对数。

### 4. 渐进式句子学习 (Progressive Sentence Learning)
特色核心功能：将长难句拆解为循序渐进的学习阶梯：
```
Step 1: Where (疑问词)
Step 2: Where did (助动词结构)
Step 3: Where did you (主谓骨架)
Step 4: Where did you go (谓语短语)
Step 5: during the holiday (时间状语短语)
Step 6: Where did you go during the holiday? (完整语境句子)
```
- **视觉淡入动画**：进入新步骤时，新增的词汇或短语平滑淡入高亮。
- **句法成分精析**：提供句法分析（称呼、疑问词、助动词、主语、动词、状语等解析）。
- **多速率音频**：支持正常与 0.75x 慢速语速切换。

---

## 🚀 本地快速启动

### 步骤 1：安装依赖
```bash
npm install
```

### 步骤 2：启动服务 (全栈同时运行)
```bash
npm run dev
```
项目将在 `http://localhost:3000` 启动，服务端同时托管 `/api/*` 后端接口和前端单页应用。

### 步骤 3：使用 MySQL 8 与 Prisma (可选生产数据库模式)
在 `.env` 中配置你的 MySQL 数据库连接：
```env
DATABASE_URL="mysql://root:password@localhost:3306/english_learning"
```
执行数据库迁移及生成客户端：
```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

## 📡 API 接口总览

| 接口 | 方法 | 说明 |
| :--- | :--- | :--- |
| `/api/auth/register` | `POST` | 用户注册 |
| `/api/auth/login` | `POST` | 用户登录 |
| `/api/auth/me` | `GET` | 获取当前登录用户 |
| `/api/words/today` | `GET` | 获取今日待学单词列表 |
| `/api/words/:id` | `GET` | 获取指定单词详情及音标释义 |
| `/api/words/:id/phonics` | `GET` | 获取单词自然拼读音节拆分数据 |
| `/api/words/:id/answer` | `POST` | 校验背诵拼写答案并更新复习调度 |
| `/api/words/wrong` | `GET` | 获取错词本列表 |
| `/api/review/today` | `GET` | 获取今日到期需复习的单词 |
| `/api/sentences` | `GET` | 获取句子学习目录 |
| `/api/sentences/:id` | `GET` | 获取句子详情及递进步骤列表 |
| `/api/sentences/:id/complete` | `POST` | 记录句子完成进度 |
| `/api/dictionary/config` | `GET` | 读取用户辞书配置 |
| `/api/dictionary/config` | `PUT` | 更新用户辞书配置 |
| `/api/statistics/today` | `GET` | 获取今日学习数据指标统计 |
| `/api/statistics/overview` | `GET` | 获取整体学习进度与历史总览 |
