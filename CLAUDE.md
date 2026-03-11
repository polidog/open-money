# CLAUDE.md

このファイルは Claude Code にプロジェクトのコンテキストを提供するためのものです。

## プロジェクト概要

open-money は日本向けの家計シミュレーター（OSS）です。住宅ローン・教育費・老後資金のシミュレーション機能を提供します。

## 技術スタック

- Next.js 16 (App Router, React Compiler 有効)
- React 19
- TypeScript 5 (strict mode)
- Tailwind CSS 4
- Recharts 3（グラフ描画）
- Biome 2（リンター・フォーマッター、ESLint/Prettier の代替）

## プロジェクト構成

```
src/app/
├── page.tsx                 # メインのライフプランシミュレーター
├── loan/page.tsx            # 住宅ローンシミュレーター
├── education/page.tsx       # 教育費シミュレーター
├── retirement/page.tsx      # 老後資金シミュレーター
├── layout.tsx               # ルートレイアウト
├── components/
│   ├── LifePlanCharts.tsx   # ライフプラン用チャート
│   ├── LoanCharts.tsx       # ローン用チャート
│   └── LoanTable.tsx        # ローン返済スケジュール表
└── lib/
    ├── loan.ts              # ローン計算ロジック
    ├── education.ts         # 教育費計算ロジック
    ├── retirement.ts        # 老後資金計算ロジック
    ├── lifeplan.ts          # ライフプラン統合計算
    └── useLocalStorageState.ts  # localStorage によるステート永続化フック
```

## 開発コマンド

- `npm run dev` — 開発サーバー起動
- `npm run build` — ビルド
- `npm run lint` — `biome check` によるリント
- `npm run format` — `biome format --write` によるフォーマット

## コーディング規約

- フォーマッターとリンターは Biome を使用（インデント: スペース2つ）
- コンポーネントは `"use client"` ディレクティブを使用（クライアントサイドレンダリング）
- 型定義は各ファイル内にインラインで記述
- パスエイリアス: `@/*` → `./src/*`
- 金額の単位: ユーザー入力・表示は「万円」、内部計算は「円」を使い分ける

## アーキテクチャ上の注意点

- すべての計算はクライアントサイドで実行（バックエンド不要）
- フォーム入力は `useLocalStorageState` フックで localStorage に自動保存される
- ローン計算は元利均等返済（equal installment）と元金均等返済（equal principal）の2方式に対応
- 繰上返済は「期間短縮型」と「返済額軽減型」に対応
