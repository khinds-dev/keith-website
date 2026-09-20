---
name: retro
description: Use when the user explicitly says "/retro", "run retro", or "retrospective". Do NOT auto-invoke for general questions like "what did we learn" or "what went wrong" — only activate when the user clearly intends to run a structured retrospective.
metadata:
  disable-model-invocation: true
---

# Retro Skill — Post-Session Retrospective

## Purpose

Review the completed session and extract improvements to how Bob operates on this project. The goal is to make the next session faster and more accurate by updating the project's rules, skills, and `AGENTS.md`.

---

## Step 1: Analyse the Session

Review the full conversation and identify issues across these specific surfaces:

**Bob's behaviour:**
- Moments where Bob made incorrect assumptions about the project
- Questions asked that should have been answerable from existing `AGENTS.md` guidance
- Tasks that required multiple correction rounds before getting right
- Tone, formatting, or style that didn't match what was expected
- Anything that required the user to repeat themselves or re-explain

**Project documentation gaps:**
- Anything missing from `AGENTS.md` that would have prevented a problem (architecture facts, deployment rules, API design rules, nav conventions, etc.)
- A `.bob/rules/` rule that doesn't exist yet but should
- A skill trigger phrase that didn't match how the user actually invoked the task

**`ISSUES.md` — check for resolved items:**
- Read [`ISSUES.md`](ISSUES.md) and review each open `- [ ]` item
- If any outstanding issue was fully resolved during this session, note it for updating in Step 4
- Do not mark items resolved speculatively — only if the fix was confirmed in this session

**Root causes:**
For each problem found, identify *why* it happened: missing rule, unclear `AGENTS.md` entry, wrong skill description, project context that exists but wasn't surfaced when needed.

---

## Step 2: Present Your Findings

**Before creating any todo list or making any changes**, write a plain conversational summary covering:

1. **What went wrong** — specific moments with enough detail to understand the failure
2. **Root causes** — why each problem happened
3. **Proposed improvements** — one concrete fix per root cause, with an explanation of why it would help
4. **ISSUES.md updates** — list any open items that were resolved this session and should be checked off

**If there are no proposed improvements and no `ISSUES.md` items to close, stop here.** Do not create a todo list or make changes when there is nothing to improve.

---

## Step 3: Create Implementation Plan

Only after presenting your findings, use `update_todo_list` to create a checklist of changes in priority order.

**Format:**
```
[ ] Update AGENTS.md — brief description of what to add or change
[ ] Add rule at .bob/rules/<name>.md — what it should cover
[ ] Update skill at .bob/skills/<name>/SKILL.md — what to clarify
[ ] Mark ISSUES.md item resolved — SEC-01: HSTS (or whichever item)
```

Use plain file paths — no markdown link syntax in the todo list.

**Priority order:**
1. High — prevents errors or rework
2. Medium — improves efficiency or reduces back-and-forth
3. Low — polish or nice-to-have

If a todo list already exists in the session, prepend the new entries.

---

## Step 4: Implement Changes

Work through the todo list item by item:

1. Mark the item `[-]` (in progress) in the same update that marks the previous item `[x]` done
2. Read the current file before editing (if updating an existing file)
3. Apply the change using `apply_diff`, `search_and_replace`, or `write_file` as appropriate
4. Mark the item `[x]` complete
5. Move to the next item

**Files you may modify:**
- `AGENTS.md` — project-level context, conventions, deployment rules, nav rules, architecture facts, API design rules
- `ISSUES.md` — mark resolved items by replacing `- [ ]` with `- [x]` and adding a brief resolution note and date
- `.bob/rules/<name>.md` — focused, reusable rules for specific coding or style conventions
- `.bob/skills/<name>/SKILL.md` — skill descriptions and workflows

**Choosing between `AGENTS.md` and a rule file:**
- Use `AGENTS.md` for project context, architecture facts, deployment procedures, and conventions that apply to almost every task
- Use a rule file for a specific, self-contained convention (e.g. "always use trailing slashes in canonical tags")
- Use a skill update when a trigger phrase is wrong, a workflow step is missing, or the description doesn't match how the user actually invokes it

---

## Step 5: Confirm and Commit

After all changes are implemented, write a short summary of what was changed and why.

Then ask the user if they want to commit. If yes, stage and commit using the project's git convention — the user can also just say "push" and Bob will handle it.
