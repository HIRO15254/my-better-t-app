---
description: GitHub Issueを監視し、ワークフローの状態に応じてspeckitパイプラインを自動実行する
---

## 概要

GitHub Issueの `wf:*` ラベルを監視し、AIがボールを持っている状態のIssueに対して、speckitパイプラインの各ステージを自動実行する。
人間の承認が必要な箇所ではラベルを変更してボールを渡し、承認後（次回ポーリング時）に次のステージに進む。

**呼び出し方法**:
- 手動: `/workflow.monitor`
- 定期実行: `/loop 5m /workflow.monitor`（3日間有効、セッション終了で停止）

## ワークフロー状態一覧

| ラベル | ボール | 次のアクション |
|--------|--------|----------------|
| `wf:needs-spec` | AI | 仕様書を作成して `wf:spec-review` へ |
| `wf:spec-review` | 人間 | `/approve` or `/reject` 待ち |
| `wf:needs-plan` | AI | 実装計画を作成して `wf:plan-review` へ |
| `wf:plan-review` | 人間 | `/approve` or `/reject` or `/reject-to-spec` 待ち |
| `wf:implementing` | AI | 実装して `wf:impl-review` へ |
| `wf:impl-review` | 人間 | `/approve` or `/change-spec` 待ち |
| `wf:done` | — | 完了 |
| `wf:blocked` | — | 手動解決待ち |

---

## 実行フロー

### Step 1: AIボールのIssueを探す

以下のコマンドでAIが処理すべきIssueを取得する:

```bash
gh issue list --label "wf:needs-spec" --json number,title,body,labels --limit 50
gh issue list --label "wf:needs-plan" --json number,title,body,labels --limit 50
gh issue list --label "wf:implementing" --json number,title,body,labels --limit 50
```

- 結果が空なら「処理対象のIssueはありません」と報告して終了
- 複数ある場合は、最もnumber（Issue番号）が小さいものを1つ選択
- 優先度: `wf:needs-spec` → `wf:needs-plan` → `wf:implementing`（依存関係順）

### Step 2: 選択したIssueの情報を収集

```bash
gh issue view {NUMBER} --json number,title,body,labels,comments
```

差し戻しの場合は最新コメントに `/reject` や `/reject-to-spec` + 修正理由が含まれている。
差し戻しコメントがあれば、その理由をフィードバックとして使用する。

### Step 3: 状態に応じたアクションを実行

---

## State: `wf:needs-spec` → 仕様書作成（spec-writer エージェントに委譲）

### 目的
Issue本文の自然言語要件から、spec-writer エージェントを起動して仕様書作成を委譲する。

### 実行手順

1. **Issue情報を収集**
   - Issue本文（body）、タイトル、番号を取得
   - 差し戻しの場合: 最新の `/reject` コメントから修正理由を抽出
   - 差し戻しの場合: Issueコメント履歴から `**ブランチ**: \`` パターンで既存ブランチ名を特定

2. **MODE判定**
   - Issueコメントに「仕様書が完成しました」が含まれる = `revision`（差し戻し後の再実行）
   - 含まれない = `new`（初回実行）

3. **spec-writer エージェントを起動**

   Agent tool で `.claude/agents/spec-writer.md` を `subagent_type: "general-purpose"` で spawn する。

   **新規の場合のprompt**:
   ```
   以下のGitHub Issueの仕様書を作成してください。
   `.claude/agents/spec-writer.md` を読み、Execution Protocol に従って全ステップを実行してください。

   ISSUE_NUMBER: {NUMBER}
   ISSUE_TITLE: {TITLE}
   ISSUE_BODY:
   {BODY}

   MODE: new
   ```

   **差し戻しの場合のprompt**:
   ```
   以下のGitHub Issueの仕様書を修正してください。
   `.claude/agents/spec-writer.md` を読み、Execution Protocol に従って全ステップを実行してください。

   ISSUE_NUMBER: {NUMBER}
   ISSUE_TITLE: {TITLE}
   ISSUE_BODY:
   {BODY}

   MODE: revision
   REJECTION_REASON:
   {最新の /reject コメントから抽出した修正理由}

   EXISTING_BRANCH: {既存ブランチ名}
   ```

4. **エラーハンドリング（monitor側フォールバック）**
   - エージェント完了後、ラベルが `wf:spec-review` に遷移していることを確認
   - 遷移していない場合（エージェント内でエラー発生）:
     ```bash
     gh issue comment {NUMBER} --body "## ⚠️ 仕様書作成でエラーが発生しました\n\n手動での対応が必要です。"
     gh issue edit {NUMBER} --remove-label "wf:needs-spec" --add-label "wf:blocked"
     ```

---

## State: `wf:needs-plan` → 実装計画・タスク作成

### 目的
承認済みの仕様書から、実装計画（plan.md）とタスク一覧（tasks.md）を作成する。

### 実行手順

1. **コンテキストを読み込み**
   - Issueコメント履歴からBRANCH_NAMEを特定
   - branchをチェックアウト
   - spec.mdを読み込み
   - `.specify/memory/constitution.md` を読み込み
   - 差し戻しの場合: 最新の `/reject` コメントから修正指示を取得

2. **実装計画を生成** (speckit.plan 相当)
   - `.specify/scripts/powershell/setup-plan.ps1 -Json` でplan テンプレートを配置
   - Technical Context を記入（プロジェクトのtech stack、unknownsはNEEDS CLARIFICATIONとして）
   - Constitution Check を実施
   - Phase 0: research.md 生成（unknowns解決）
   - Phase 1: data-model.md、contracts/ 生成
   - 差し戻しの場合: 修正指示に基づいて既存planを更新

3. **タスク一覧を生成** (speckit.tasks 相当)
   - plan.md、spec.md からタスクを抽出
   - `.specify/templates/tasks-template.md` の構造に従う
   - Phase 1: Setup → Phase 2: Foundational → Phase 3+: User Story別 → Final: Polish
   - 各タスク: `- [ ] [TaskID] [P?] [Story?] Description with file path`
   - テスト tasks を含む

4. **分析** (speckit.analyze 相当)
   - カバレッジギャップ、孤立タスク、依存関係矛盾をチェック
   - CRITICAL/HIGHの問題があれば自動修正

5. **commit & push**
   ```bash
   git add specs/
   git commit -m "Generate plan and tasks for #{NUMBER}: {title}"
   git push origin {BRANCH_NAME}
   ```

6. **Issueコメントを投稿**（折りたたみ方式）

   ```bash
   gh issue comment {NUMBER} --body "$(cat <<'COMMENT_EOF'
   ## 📋 実装計画が完成しました

   **タスク数**: {X}件（{Y} フェーズ）
   **並列実行可能**: {Z}件

   <details>
   <summary>実装計画全文を表示</summary>

   {plan.md の全内容}

   </details>

   <details>
   <summary>タスク一覧を表示</summary>

   {tasks.md の全内容}

   </details>

   ---
   `/approve` → 承認して実装へ | `/reject 修正理由` → 計画を修正 | `/reject-to-spec 理由` → 仕様からやり直し
   COMMENT_EOF
   )"
   ```

7. **ラベルを遷移**
   ```bash
   gh issue edit {NUMBER} --remove-label "wf:needs-plan" --add-label "wf:plan-review"
   ```

---

## State: `wf:implementing` → 実装

### 目的
承認済みのタスク一覧に基づいて、Agent Teamsで実装し、テストがパスすることを確認してPRを作成する。

### 実行手順

1. **コンテキストを読み込み**
   - Issueコメント履歴からBRANCH_NAMEを特定
   - branchをチェックアウト
   - tasks.md、plan.md、spec.md を読み込み
   - `.specify/memory/constitution.md` を読み込み

2. **実装** (speckit.implement 相当)
   - tasks.md からタスクを解析し、ドメイン分類:
     - `apps/web/`, `.tsx`, `components/`, `routes/` → FRONTEND
     - `apps/server/`, `packages/api/`, `routers/` → BACKEND
     - `packages/db/`, `schema/`, `migration` → DATABASE
     - 複数ドメイン → CROSS-DOMAIN（Lead直接実行）
   - Phase 1-2: Lead（あなた）が直接実行
   - Phase 3+: Agent Teams で並列実行
     - 各ドメインに1つのteammateを割り当て
     - `.claude/agents/{domain}.md` のドメイン専門知識を参照
   - Final Phase: Lead が直接実行（polish、integration）

3. **テスト必須**
   ```bash
   bun run test
   bun run check-types
   bun run check
   ```
   - 全てパスしなければPRを作成しない
   - テスト失敗の場合: 修正を試みる（最大3回）
   - 修正不能な場合: `wf:blocked` に遷移してIssueコメントでエラー報告

4. **commit & push**
   ```bash
   git add -A
   git commit -m "Implement #{NUMBER}: {title}"
   git push origin {BRANCH_NAME}
   ```

5. **PR作成**
   ```bash
   gh pr create --base master --head {BRANCH_NAME} --title "{title}" --body "$(cat <<'PR_EOF'
   ## Summary
   {実装内容のサマリー}

   Closes #{NUMBER}

   ## Changes
   {変更ファイル一覧}

   ## Test
   - [x] `bun run test` passed
   - [x] `bun run check-types` passed
   - [x] `bun run check` passed
   PR_EOF
   )"
   ```

6. **Issueコメントを投稿**（折りたたみ方式）

   ```bash
   gh issue comment {NUMBER} --body "$(cat <<'COMMENT_EOF'
   ## 🚀 実装が完了しました

   **PR**: #{PR_NUMBER}
   **テスト**: 全パス ✅
   **変更ファイル**: {X}件

   <details>
   <summary>実装サマリーを表示</summary>

   {変更ファイル一覧、テスト結果、実装概要}

   </details>

   ---
   `/approve` → PRマージ・完了 | `/change-spec 理由` → 仕様変更
   COMMENT_EOF
   )"
   ```

7. **ラベルを遷移**
   ```bash
   gh issue edit {NUMBER} --remove-label "wf:implementing" --add-label "wf:impl-review"
   ```

---

## 差し戻し処理の共通ルール

差し戻し（`/reject`, `/reject-to-spec`, `/change-spec`）が発生した場合:

1. **差し戻し理由の取得**: Issueの最新コメントから `/reject` `/reject-to-spec` `/change-spec` の後のテキストを抽出
2. **Delta修正**: 既存の成果物を全面書き直しせず、差し戻し理由に基づいて該当箇所のみ更新
3. **履歴保持**: 以前のIssueコメント（仕様書・計画）は残したまま、新しいバージョンを追加投稿
4. **ブランチ再利用**: 既存のfeature branchを引き続き使用

## エラーハンドリング

- **Script失敗**: エラー内容をIssueコメントに投稿、`wf:blocked` に遷移
- **テスト失敗**: 最大3回修正を試行、それでも失敗なら `wf:blocked` に遷移
- **Git競合**: マージ競合が発生したらIssueコメントで報告、`wf:blocked` に遷移

## 注意事項

- 1回のmonitor実行で処理するIssueは**1つのみ**（他は次回ポーリングで処理）
- 処理中のIssueがある場合、`wf:implementing` ラベルが付いている間は他のIssueをスキップ
- `wf:needs-spec` は `.claude/agents/spec-writer.md` エージェントに委譲（他ステージは将来エージェント化予定）
- Git操作は常に feature branch 上で行い、master を直接変更しない
