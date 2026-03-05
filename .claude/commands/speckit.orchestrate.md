---
description: Run the full spec-kit pipeline from natural language to implementation with stage-by-stage user approval
---

## User Input

```text
$ARGUMENTS
```

You **MUST** have a feature description to proceed. If `$ARGUMENTS` is empty, ask the user to provide a natural language feature description.

## Overview

This command orchestrates the **entire spec-kit pipeline** in a single conversation, executing each stage inline (NOT via handoffs) and pausing for user approval after each stage.

**Pipeline**: Specify → Clarify → Plan → Tasks → Analyze → Implement

**Key Design**: Each stage's logic runs inline within this conversation. Do NOT use handoffs or invoke other `/speckit.*` commands — this preserves orchestration context and progress tracking across all stages.

---

## Progress Tracking

Maintain and display this progress block after each stage completes. Update it throughout the pipeline:

```
## Pipeline Progress
- [ ] Specify — Waiting...
- [ ] Clarify — Waiting...
- [ ] Plan — Waiting...
- [ ] Tasks — Waiting...
- [ ] Analyze — Waiting...
- [ ] Implement — Waiting...
```

---

## Stage 1: Specify

**Goal**: Generate a feature specification from the natural language description.

### Execution

1. **Generate a concise short name** (2-4 words) from the feature description:
   - Use action-noun format (e.g., "user-auth", "analytics-dashboard")
   - Preserve technical terms and acronyms

2. **Check for existing branches** before creating a new one:
   a. `git fetch --all --prune`
   b. Find highest feature number across: remote branches, local branches, specs directories
   c. Use N+1 for the new branch

3. **Run** `.specify/scripts/powershell/create-new-feature.ps1 -Json "$ARGUMENTS"` with the calculated number and short-name.
   - Parse JSON output for BRANCH_NAME and SPEC_FILE

4. **Load** `.specify/templates/spec-template.md` to understand required sections.

5. **Generate spec** following the specify workflow:
   - Parse user description, extract key concepts (actors, actions, data, constraints)
   - Make informed guesses for unclear aspects (max 3 NEEDS CLARIFICATION markers)
   - Fill all mandatory sections: Overview, User Scenarios, Functional Requirements, Success Criteria
   - Write specification to SPEC_FILE

6. **Validate spec quality**:
   - Create checklist at FEATURE_DIR/checklists/requirements.md
   - Run validation, fix issues (max 3 iterations)
   - If NEEDS CLARIFICATION markers remain, present questions to user and wait for answers
   - Update spec with answers

### Stage Gate

Display the progress block (Specify marked complete) and present:
- Branch name and spec file path
- Summary of the specification (key user stories, scope)
- Any remaining concerns

**Ask user**: "仕様を確認してください。次のステージ（Clarify）に進みますか？修正が必要な場合はお知らせください。"

Wait for user approval before proceeding.

---

## Stage 2: Clarify

**Goal**: Identify and resolve ambiguities in the specification.

### Execution

1. **Read the spec** from SPEC_FILE
2. **Analyze for ambiguities** across these categories:
   - Scope boundaries (what's included/excluded)
   - User types and permissions
   - Data flow and state management
   - Error handling and edge cases
   - Performance expectations
   - Security requirements
   - Integration points
   - Accessibility requirements

3. **If ambiguities found** (max 5 questions):
   - Present each as a structured question with suggested answers
   - Wait for user responses
   - Update spec with clarified details
   - Add clarification session to spec with date

4. **If no ambiguities**: Report "No significant ambiguities found" and skip to gate.

### Stage Gate

Display updated progress block and present:
- Summary of clarifications made (or "No clarifications needed")
- Updated spec highlights

**Ask user**: "明確化が完了しました。次のステージ（Plan）に進みますか？"

Wait for user approval before proceeding.

---

## Stage 3: Plan

**Goal**: Generate technical implementation plan with design artifacts.

### Execution

1. **Run** `.specify/scripts/powershell/setup-plan.ps1 -Json` and parse JSON output
2. **Load context**: Read FEATURE_SPEC, `.specify/memory/constitution.md`, IMPL_PLAN template

3. **Execute plan workflow**:
   - Fill Technical Context (detect unknowns)
   - Check against Constitution principles
   - **Phase 0**: Generate research.md (resolve unknowns, research best practices)
   - **Phase 1**: Generate data-model.md, contracts/, quickstart.md
   - Update agent context via `.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude`
   - Re-evaluate Constitution compliance

4. **Validate**: Ensure no unresolved NEEDS CLARIFICATION in plan artifacts

### Stage Gate

Display updated progress block and present:
- Generated artifacts list (plan.md, research.md, data-model.md, contracts/, etc.)
- Architecture summary (tech decisions, data model overview)
- Constitution compliance status

**Ask user**: "技術計画を確認してください。次のステージ（Tasks）に進みますか？"

Wait for user approval before proceeding.

---

## Stage 4: Tasks

**Goal**: Generate dependency-ordered, actionable task list.

### Execution

1. **Run** `.specify/scripts/powershell/check-prerequisites.ps1 -Json` and parse FEATURE_DIR
2. **Load**: plan.md, spec.md, and optional data-model.md, contracts/, research.md

3. **Generate tasks** following `.specify/templates/tasks-template.md` structure:
   - Phase 1: Setup tasks
   - Phase 2: Foundational (blocking prerequisites)
   - Phase 3+: One phase per user story (priority order)
   - Final Phase: Polish & cross-cutting concerns
   - Every task in strict checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

4. **Include test tasks**: For every implementation task, include a corresponding test task or embed test generation in the task description.

5. **Mark parallel opportunities**: Tag independent tasks with `[P]`

6. **Write tasks.md** to FEATURE_DIR

### Stage Gate

Display updated progress block and present:
- Total task count and breakdown by phase
- Parallel opportunities identified
- Suggested MVP scope
- Estimated agent dispatch plan (how many parallel vs sequential)

**Ask user**: "タスク一覧を確認してください。次のステージ（Analyze）に進みますか？"

Wait for user approval before proceeding.

---

## Stage 5: Analyze

**Goal**: Cross-artifact consistency and quality analysis.

### Execution

1. **Load all artifacts**: spec.md, plan.md, tasks.md, and optional data-model.md, contracts/
2. **Analyze for**:
   - **Coverage gaps**: User stories in spec without corresponding tasks
   - **Orphan tasks**: Tasks not traced to any user story
   - **Dependency conflicts**: Circular dependencies or missing prerequisites
   - **Constitution violations**: Tasks that don't follow project principles
   - **Naming inconsistencies**: Entity/field names that differ across artifacts
   - **Missing tests**: Implementation tasks without test coverage
   - **Ambiguities**: Vague task descriptions that agents can't execute

3. **Classify findings** by severity: CRITICAL, HIGH, MEDIUM, LOW
4. **For CRITICAL/HIGH issues**: Propose specific fixes
5. **Apply auto-fixable changes** to tasks.md (like adding missing test tasks)

### Stage Gate

Display updated progress block and present:
- Findings summary table (count by severity)
- List of CRITICAL/HIGH findings with proposed fixes
- Applied auto-fixes

**Ask user**: "分析が完了しました。次のステージ（Implement）に進みますか？指摘事項への対応が必要な場合はお知らせください。"

Wait for user approval before proceeding.

---

## Stage 6: Implement

**Goal**: Execute all tasks using Agent Teams with domain-specialized teammates.

### Execution

Execute the full implementation logic as defined in the `/speckit.implement` command, using **Agent Teams**:

1. **Parse tasks.md** and classify each task by domain:
   - `apps/web/`, `.tsx`, `components/`, `routes/` → **FRONTEND**
   - `apps/server/`, `packages/api/`, `routers/` → **BACKEND**
   - `packages/db/`, `schema/`, `migration` → **DATABASE**
   - Multiple domains or config → **CROSS-DOMAIN** (Lead handles directly)

2. **Phase 1-2 (Setup, Foundational)**: Lead executes directly using Task tool
   - These phases often have cross-domain dependencies
   - Run `bun run test` after each phase

3. **Phase 3+ (User Stories)**: Create Agent Team and spawn domain teammates
   - Create team via TeamCreate
   - Spawn one teammate per domain that has tasks (max 3: frontend, backend, database)
   - Each teammate reads `.claude/agents/{domain}.md` for domain expertise
   - Each teammate handles ALL tasks for their domain sequentially
   - Domains execute in **parallel**, tasks within a domain execute **sequentially**
   - `TaskCompleted` hook automatically runs `bun run test` after each task
   - Lead monitors progress, handles cross-domain tasks, resolves blockers

4. **Final Phase (Polish)**: Lead executes directly
   - Shut down teammates via SendMessage (`type: "shutdown_request"`)
   - Clean up team via TeamDelete
   - Execute integration and polish tasks

5. **Final validation**:
   - `bun run test` — all tests pass
   - `bun run check-types` — no type errors
   - Report completion summary

### Domain Expertise

Teammates reference `.claude/agents/` for implementation patterns:
- **Frontend** (`.claude/agents/frontend.md`): React 19 + shadcn/ui + TanStack Router + Testing Library
- **Backend** (`.claude/agents/backend.md`): Hono + tRPC v11 + Zod + mock-based testing
- **Database** (`.claude/agents/database.md`): Drizzle ORM + pgTable + getTableColumns testing

### Implementation Gate (per phase)

After each phase completes, briefly report:
- Tasks completed in this phase (by teammate)
- Test results
- Any failures or issues

Continue to next phase automatically unless errors require user attention.

### Final Report

After all phases complete, display:

```
## Implementation Complete

### Summary
- Total tasks: XX completed, XX failed, XX skipped
- Tests: XX passed, XX failed
- Type check: PASS/FAIL

### Team Execution
- Frontend teammate: X tasks completed
- Backend teammate: X tasks completed
- Database teammate: X tasks completed
- Lead (cross-domain): X tasks completed

### Files Created/Modified
[List of all files touched]

### Test Coverage
[List of test files created]

### Next Steps
- Review the implementation
- Run `bun run test` to verify
- Run `bun run check-types` for type safety
- Consider running `bun run dev` to test manually
```

---

## Error Handling

- **Stage failure**: If any stage encounters an unrecoverable error, halt and report to user with context
- **Agent failure**: If a task agent fails, report which task failed and ask user how to proceed:
  - Retry the task
  - Skip and continue
  - Halt implementation
- **Test failure**: If `bun run test` fails after a phase, halt and report broken tests
- **Constitution violation**: Flag but don't block — report for user review

## General Rules

- **Never use handoffs** — all stages run inline to preserve context
- **Always wait for user approval** between stages (except within implement phases)
- **Track progress** visually with the progress block
- **Use absolute paths** for all file references
- **Read before write** — always read existing files before modifying
- **Test everything** — every implementation task must produce tests
