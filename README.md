# Nagomi Ledger (和み 記帳) - 共享費用與分攤還款系統

> 專為多人旅行、合租生活與聚會活動設計的共享費用分攤與結算記帳系統，具備日系極簡與禪意美學界面。

---

## 🛠 技術棧 (Tech Stack)

- **核心框架**：React 19 (`react`, `react-dom`)
- **開發語言**：TypeScript (嚴格型別模式，零 `any`)
- **構建工具**：Vite 6 (`@vitejs/plugin-react`)
- **樣式設計**：Tailwind CSS v4 (`@tailwindcss/vite`)
- **動態效果**：Motion (`motion`)
- **圖示庫**：Lucide React (`lucide-react`)
- **狀態管理**：React Context API (`LedgerContext`)

---

## 📋 環境需求 (Prerequisites)

- **Node.js**：建議 `v20.12.0` 以上版本（支援 Node.js 20.x / 22.x）
- **套件管理工具**：`npm` (v10+), `pnpm` 或 `yarn`

---

## 🚀 快速上手 (Quick Start)

### 1. 安裝相依套件

```bash
npm install
```

### 2. 環境變數設定

複製範例環境變數檔並根據需求調整：

```bash
# Windows PowerShell
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

`.env` 變數說明：
- `GEMINI_API_KEY`: Google Gemini API 金鑰（如需使用 AI 相關功能）
- `APP_URL`: 應用程式部署或運行的主機 URL
- `DISABLE_HMR`: 是否關閉熱模組替換（預設為開啟，特殊開發環境可設為 `true`）

### 3. 啟動開發伺服器

```bash
npm run dev
```

啟動後，瀏覽器造訪：
- 本地網址：`http://localhost:3000/`
- 區域網路網址：`http://<您的IP>:3000/`

---

## 📜 常用腳本指令 (Scripts)

| 指令 | 說明 |
| :--- | :--- |
| `npm run dev` | 啟動 Vite 本地開發伺服器（預設 Port: `3000`，監聽 `0.0.0.0`） |
| `npm run build` | 執行 TypeScript 型別檢查並編譯打包生產環境程式碼至 `dist/` |
| `npm run preview` | 預覽生產環境打包結果 |
| `npm run lint` | 執行 `tsc --noEmit` 進行靜態型別嚴格檢查 |
| `npm run deploy` | 自動建置並將 `dist/` 靜態檔案發布至 GitHub Pages (`gh-pages` 分支) |
| `npm run clean` | 跨平台清理 `dist/` 打包產出目錄 |

---

## 📂 專案目錄結構 (Project Structure)

```text
├── .env.example            # 環境變數範本
├── .gitignore              # Git 忽略清單（依賴、產出、快取與環境變數）
├── index.html              # HTML 入口
├── package.json            # 專案套件配置與腳本
├── tsconfig.json           # TypeScript 編譯設定
├── vite.config.ts          # Vite 與 Tailwind 配置
├── src/
│   ├── App.tsx             # 主應用程式入口與分頁導覽
│   ├── main.tsx            # React DOM 掛載點
│   ├── index.css           # 全域樣式與 Tailwind 配置
│   ├── types.ts            # 全域型別定義（帳本、使用者、支出、公積金等）
│   ├── context/
│   │   └── LedgerContext.tsx # 核心狀態管理（帳本、交易紀錄、結算邏輯）
│   └── components/
│       ├── Navbar.tsx            # 頂部導航列與使用者切換
│       ├── DashboardView.tsx     # 儀表板總覽視圖
│       ├── ExpensesView.tsx      # 費用明細與篩選視圖
│       ├── SettlementView.tsx    # 智慧結算與債務簡化還款視圖
│       ├── ReportsView.tsx       # 統計報表與圖表分析
│       ├── SettingsView.tsx      # 帳本與公積金設定
│       ├── AddExpenseModal.tsx   # 新增/編輯支出彈窗
│       ├── DepositFundModal.tsx  # 公積金儲值彈窗
│       ├── FilterBottomSheet.tsx # 支出條件篩選抽屜
│       └── CustomSelect.tsx      # 客製化下拉選單組件
```

---

## 💡 開發與協作規範

1. **嚴格型別**：全專案採用 TypeScript，嚴禁使用 `any` 型別。
2. **命名規範**：
   - 變數與函式：`camelCase`
   - React 元件與型別：`PascalCase`
3. **樣式規範**：統一使用 Tailwind CSS 工具類別，避免使用 inline styles。
4. **安全規範**：切勿將任何金鑰、Token 或個人敏感情資提交至版本控制，所有機密資訊均自 `.env` 讀取。
