# Implementation Plan: モバイル基本レイアウト（Mobile Shell）

**Branch**: `001-mobile-shell` | **Date**: 2026-03-12 | **Spec**: `specs/001-mobile-shell/spec.md`
**Input**: Feature specification from `/specs/001-mobile-shell/spec.md`

## Summary

モバイルビューポート（幅767px以下）で画面下部に固定表示される5項目のボトムナビゲーションバーを実装する。Tabler Icons + テキストラベルで構成し、TanStack Router のパス同期によるアクティブ状態表示を備える。デスクトップ（768px以上）では Tailwind のレスポンシブクラスで非表示にする。

## Technical Context

**Language/Version**: TypeScript (strict mode), React 19
**Primary Dependencies**: @tanstack/react-router v1.141, @tabler/icons-react v3.39 (installed), Tailwind CSS v4
**Storage**: N/A（フロントエンドのみ）
**Testing**: Vitest + Testing Library + jsdom
**Target Platform**: モバイル・デスクトップ Web ブラウザ
**Project Type**: Web application (monorepo)
**Performance Goals**: ナビゲーション遷移時のアクティブ状態更新が瞬時に反映
**Constraints**: 追加パッケージ不要、既存の依存関係のみで実装可能
**Scale/Scope**: コンポーネント1つ + ルートレイアウト修正

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Type Safety First | ✅ Pass | NavigationItem 型を定義、props に明示的な型付け |
| II. Monorepo Package Boundaries | ✅ Pass | apps/web 内のみの変更、パッケージ境界を跨がない |
| III. Test Coverage Required | ✅ Pass | コンポーネントテスト（Testing Library + jsdom）を含む |
| IV. Code Quality Automation | ✅ Pass | Biome/Ultracite で自動フォーマット |
| V. API Contract Discipline | ✅ N/A | API 変更なし |
| YAGNI | ✅ Pass | 最小限の実装：コンポーネント1つ + レイアウト修正のみ |

## Project Structure

### Documentation (this feature)

```text
specs/001-mobile-shell/
├── spec.md              # Feature specification
├── plan.md              # This file
├── checklists/          # Requirements checklist
└── tasks.md             # Task list
```

### Source Code (repository root)

```text
apps/web/src/
├── components/
│   ├── mobile-nav.tsx          # [NEW] ボトムナビゲーションバー
│   └── header.tsx              # [MODIFY] モバイルでの表示調整
├── routes/
│   └── __root.tsx              # [MODIFY] MobileNav を追加、モバイル用 padding-bottom
└── __tests__/
    └── mobile-nav.test.tsx     # [NEW] コンポーネントテスト
```

**Structure Decision**: 既存の apps/web/src/components/ ディレクトリに mobile-nav.tsx を追加。新規ディレクトリ作成不要。ルートレイアウト（__root.tsx）に組み込むことで全ページに適用。

## Design Decisions

### ナビゲーション5項目

仕様では「5個のナビゲーション項目の具体的なページ・ラベルは実装時に確定する」としている。既存ルート（/, /dashboard, /todos）に加え、将来のページ用プレースホルダーを含む5項目を設定する：

| # | ラベル | パス | アイコン | 理由 |
|---|--------|------|----------|------|
| 1 | ホーム | `/` | IconHome | アプリのトップページ |
| 2 | ダッシュボード | `/dashboard` | IconLayoutDashboard | 既存の保護ルート |
| 3 | Todo | `/todos` | IconChecklist | 既存のTodoページ |
| 4 | 検索 | `/search` | IconSearch | 一般的なモバイルアプリの標準項目 |
| 5 | 設定 | `/settings` | IconSettings | ユーザー設定へのアクセス |

> 項目4・5は遷移先ルートが未実装の場合、プレースホルダーページを作成する。

### レスポンシブ制御方式

CSS メディアクエリ（Tailwind の `md:` prefix = 768px）で制御。JavaScript によるビューポート検出は不要。

- `md:hidden` — ナビゲーションバー自体をデスクトップで非表示
- `pb-16 md:pb-0` — メインコンテンツの下部パディングをモバイルのみ適用

### アクティブ状態の検出

TanStack Router の `useRouterState({ select: (s) => s.location.pathname })` を使用。URL パスとナビゲーション項目のパスを前方一致で比較し、アクティブ状態を判定。ブラウザの前後ナビゲーションにも自動追従。

## Complexity Tracking

> 違反なし — 最小限の実装で全要件を満たす。
