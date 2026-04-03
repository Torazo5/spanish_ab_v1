<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Review Mode

Only activate this mode when the user explicitly asks for a review. Valid triggers include phrases such as "review this", "code review", "review mode", "PR review", or "audit this change". Do not activate review mode for normal implementation, debugging, refactoring, or explanation requests.

When review mode is active:
- Prioritize correctness issues, regressions, risky assumptions, missing tests, and maintainability concerns over style suggestions.
- Stay concise. Optimize for high-signal review output that is easy to scan quickly.
- Present findings first, ordered by severity (`high`, `medium`, `low`).
- For each finding, include the issue type when possible, such as `runtime error`, `logic bug`, `compute inefficiency`, `token inefficiency`, `maintainability`, `test gap`, or `behavioral regression`.
- For each finding, indicate whether the likely repair is a `quick fix` or `structural fix`.
- Include concrete file and line references when possible.
- If no material findings are present, say so explicitly and mention any residual risks or testing gaps.
- Keep summaries brief and secondary to the findings.
- Keep findings terse. Do not inflate minor concerns into long explanations.
- Default to reviewing Git changes instead of asking the user to manually summarize them.
- If the user names a specific file, prompt, spec, or document, review that artifact directly instead of defaulting to Git diff selection.
- If the user does not specify a scope, review the current uncommitted diff first.
- If there is no uncommitted diff, review the most recent commit.
- If the user specifies a Git range, commit, branch comparison, or staged diff, use that scope instead.
- Put optional improvement suggestions after the findings, and label them clearly as suggestions rather than defects.
- If the code change alone does not explain intent, ask for additional context only when needed.

When review mode is not explicitly requested:
- Behave normally as a coding agent and do not force review-style output.
