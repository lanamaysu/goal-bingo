# 目標賓果 顏色系統規範

## 核心原則

1. **Accent 顏色系統** - 用於強調、邊框、選中狀態
   - Light mode: `text-accent` (暗化的 accent)
   - Dark mode: `text-accent` (亮化的 accent)

2. **Foreground 顏色系統** - 用於深色背景上的文字
   - Light mode: `text-foreground` (最亮色 brand-mint)
   - Dark mode: `text-foreground` (最暗色 brand-dark)

3. **背景顏色一致性**
   - 淺色背景: `bg-white`, `bg-white/50`, `bg-white/70`, `bg-*-mint/10`
   - 深色背景: `bg-brand-petrol`, `bg-brand-dark`, `bg-brand-rust`
   - 半透明: `dark:bg-black/20`, `dark:bg-black/30`

## 顏色使用規則

### 文字顏色

| 場景         | Light Mode        | Dark Mode         |
| ------------ | ----------------- | ----------------- |
| 標準文字     | `text-accent`     | `text-accent`     |
| 深色背景文字 | `text-foreground` | `text-foreground` |
| 次要文字     | `text-accent/70`  | `text-accent/70`  |
| 禁用/灰色    | `text-gray-500`   | `text-gray-400`   |

### 背景顏色

| 場景     | Light Mode                              | Dark Mode          |
| -------- | --------------------------------------- | ------------------ |
| 模態背景 | `bg-white`                              | `bg-brand-surface` |
| 卡片背景 | `bg-white/50` 或 `bg-white/70`          | `bg-black/20`      |
| 淺色強調 | `bg-brand-mint/10`                      | `bg-black/20`      |
| 深色強調 | `bg-brand-petrol`                       | `bg-brand-petrol`  |
| 標籤背景 | `bg-*-brand/10` (如 `bg-brand-rust/10`) | 同 light           |

### 按鈕樣式

| 按鈕類型      | 樣式                                                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Primary (cta) | `bg-brand-petrol text-foreground`                                                                                             |
| Secondary     | `bg-white border-2 border-accent/30 text-accent dark:bg-transparent dark:border-accent/30 dark:text-accent`                   |
| Danger        | `bg-white border-2 border-brand-rust/20 text-brand-rust dark:bg-brand-rust/20 dark:text-orange-200 dark:border-brand-rust/40` |
| Ghost         | `bg-transparent text-accent`                                                                                                  |

## 元件標籤 (Badges)

- **小標籤**: `text-[10px] px-1.5 py-0.5 rounded border`
- **顏色搭配**:
  - 藍色: `bg-brand-teal/10 text-accent dark:text-accent border-brand-teal/20 dark:border-brand-mint/30`
  - 棕色: `bg-brand-rust/10 text-accent dark:text-orange-200 border-brand-rust/20 dark:border-brand-rust/30`
  - 紫色: `bg-brand-purple/15 text-accent border-brand-purple/30`

## 禁止使用

- ❌ `text-gray-*` 在正文 (用 `text-accent`)
- ❌ `dark:text-brand-*` 直接搭配淺色背景
- ❌ 混合 `text-foreground` 和 `text-accent` 在同一元件
- ❌ `bg-gray-100` 或 `bg-gray-800` (用品牌色)
