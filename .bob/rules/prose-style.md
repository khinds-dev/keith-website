# Rule: Prose Style for Site Content

## Applies to
All visible body copy in HTML pages on this site: paragraphs, list items, card descriptions, hero text, and any user-facing strings rendered by JavaScript. Does NOT apply to `<title>` tags, `<meta>` tags, CSS comments, or JS code comments.

## Core rule: no em dashes in prose

Em dashes (—) in the middle of sentences are a strong marker of AI-generated writing. Never use them in body copy. Instead:

| Instead of | Use |
|---|---|
| `great work — and it shipped` | `great work. It shipped.` |
| `knowledge of X — transaction management, Y, Z` | `knowledge of X: transaction management, Y, Z` |
| `I joined IBM — which says something` | `I joined IBM. That says something` |
| `useful — both as a user and an engineer` | `useful, both as a user and an engineer` |
| `the stack — DNS, networking, containers — rather than` | `the stack (DNS, networking, containers) rather than` |

**Preferred replacements by context:**
- Use a full stop when the second half is a complete sentence
- Use a comma when joining closely related clauses
- Use a colon when introducing a list or elaboration
- Use parentheses when the aside is genuinely parenthetical

## Other AI-tell patterns to avoid

- Sentences that start "Not [X], but [Y]..." (common LLM hedging structure)
- Over-qualification ("genuinely", "particularly", "especially") stacked in a single sentence
- Parallel list structures where every item follows the exact same rhythm
- Phrases like "in a broad sense", "in the truest sense", "at its core"
- Rhetorical questions as paragraph openers

## Tone

This is a personal site. The prose should sound like a person wrote it: direct, specific, occasionally dry, never breathless. Short sentences are fine. Opinions are fine. First drafts that sound like a press release are not.
