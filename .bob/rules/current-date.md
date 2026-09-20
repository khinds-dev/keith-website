# Rule: Never Guess the Current Date

## Problem

Bob has no access to the current date. Guessing results in wrong dates being written into content, committed, deployed, and requiring multiple correction rounds.

## Rule

When any task requires writing a specific date — including but not limited to:
- "Last updated" text on any page
- Published/created dates on posts or pages
- Timestamps in documentation or changelogs

**Always ask the user for the current date before writing it.** Do not infer, assume, or guess based on training data.

## Correct behaviour

> "What's today's date? I'll use that for the 'Last updated' field."

## Incorrect behaviour

- Writing "January 2026" based on a guess
- Writing "September 2025" based on a guess
- Proceeding without asking and hoping the guess is right

## Applies to

All date fields in HTML content, markdown files, `AGENTS.md`, `ISSUES.md`, `sitemap.xml` `<lastmod>` entries, and any other user-visible or committed text.
