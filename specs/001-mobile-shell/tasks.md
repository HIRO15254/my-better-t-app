# Tasks: モバイル基本レイアウト（Mobile Shell）

**Input**: Design documents from `/specs/001-mobile-shell/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: 依存確認と基盤準備

- [ ] T001 `@tabler/icons-react` がインストール済みであることを確認（v3.39.0）
- [ ] T002 ナビゲーション項目未実装ルート（/search, /settings）のプレースホルダーページを作成: `apps/web/src/routes/search.tsx`, `apps/web/src/routes/settings.tsx`

---

## Phase 2: Foundational

**Purpose**: ナビゲーション項目の型定義

- [ ] T003 NavigationItem 型と NAVIGATION_ITEMS 定数を定義: `apps/web/src/components/mobile-nav.tsx` 上部に配置

**Checkpoint**: 型定義完了 — UI 実装可能

---

## Phase 3: User Story 1 - モバイル画面でナビゲーションが表示される (Priority: P1)

**Goal**: モバイルビューポートで画面下部に5項目のナビゲーションバーを表示し、タップでページ遷移できる

**Independent Test**: モバイルサイズのビューポートでアプリを開き、下部ナビゲーションが表示され、各項目タップでページ遷移が起きることを確認

### Tests for User Story 1

- [ ] T004 [P] [US1] MobileNav コンポーネントテスト: 5項目が表示されること、アクティブ状態が正しく反映されることを検証: `apps/web/src/__tests__/mobile-nav.test.tsx`

### Implementation for User Story 1

- [ ] T005 [US1] MobileNav コンポーネントを実装: 固定下部表示、5項目のアイコン+ラベル、TanStack Router Link によるナビゲーション: `apps/web/src/components/mobile-nav.tsx`
- [ ] T006 [US1] アクティブ状態の検出: `useRouterState` でパス同期、アクティブ項目の視覚的区別（色変更）: `apps/web/src/components/mobile-nav.tsx`
- [ ] T007 [US1] ルートレイアウトに MobileNav を組み込み、メインコンテンツにモバイル用の下部パディングを追加: `apps/web/src/routes/__root.tsx`

**Checkpoint**: モバイルでナビゲーションバーが表示され、タップ遷移とアクティブ状態が動作

---

## Phase 4: User Story 2 - デスクトップではモバイルナビゲーションが表示されない (Priority: P2)

**Goal**: デスクトップサイズのビューポートでモバイルナビゲーションバーを非表示にする

**Independent Test**: デスクトップサイズのビューポートでアプリを開き、底部ナビゲーションが表示されないことを確認

### Implementation for User Story 2

- [ ] T008 [US2] MobileNav に `md:hidden` クラスを適用してデスクトップで非表示: `apps/web/src/components/mobile-nav.tsx`
- [ ] T009 [US2] メインコンテンツの下部パディングを `pb-16 md:pb-0` でレスポンシブ制御: `apps/web/src/routes/__root.tsx`

**Checkpoint**: デスクトップでナビゲーションバーが非表示、リサイズで表示/非表示が切り替わる

---

## Phase 5: User Story 3 - ナビゲーション項目のアイコンが視認しやすい (Priority: P3)

**Goal**: Tabler Icons で統一されたアイコンセットにより、各ナビゲーション項目を直感的に識別可能にする

**Independent Test**: 5個のアイコンがラベルと組み合わせて誤解なく識別でき、アクティブ/非アクティブ状態が区別可能であることを確認

### Implementation for User Story 3

- [ ] T010 [US3] 各ナビゲーション項目に適切な Tabler Icon を設定（IconHome, IconLayoutDashboard, IconChecklist, IconSearch, IconSettings）: `apps/web/src/components/mobile-nav.tsx`
- [ ] T011 [US3] アクティブ状態のアイコン・ラベルのスタイリング（色、サイズ、太さの視覚的区別）: `apps/web/src/components/mobile-nav.tsx`

**Checkpoint**: 全アイコンが視認しやすく、アクティブ/非アクティブが明確に区別される

---

## Phase 6: Polish

**Purpose**: 品質確認とエッジケース対応

- [ ] T012 ブラウザ前後ナビゲーション時のアクティブ状態同期を確認
- [ ] T013 `bun run check-types` / `bun run test` / `bun run check` の全パス確認
- [ ] T014 ランドスケープモード・タブレットサイズでの表示確認

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 即時開始可能
- **Foundational (Phase 2)**: Phase 1 完了後
- **US1 (Phase 3)**: Phase 2 完了後 — MVP の核心
- **US2 (Phase 4)**: Phase 3 と並行可能（ただし T008 は T005 に依存）
- **US3 (Phase 5)**: Phase 3 と並行可能（ただし T010/T011 は T005 に依存）
- **Polish (Phase 6)**: 全ユーザーストーリー完了後

### Parallel Opportunities

- T004（テスト）は T005（実装）と並行して作成可能（テストファースト）
- T008/T009（US2）と T010/T011（US3）は T005 完了後に並行実行可能
- 実質的に Phase 3〜5 の実装は同一ファイル（mobile-nav.tsx）に集中するため、順次実行が効率的

### Domain Classification

- 全タスク: **FRONTEND**（apps/web/ 内のみ）
- バックエンド・データベース変更なし
