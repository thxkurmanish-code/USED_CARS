# Contributing

## Workflow

1. Create a focused branch using the `codex/` prefix unless a different naming convention is agreed.
2. Keep one logical change per commit.
3. Add or update tests with behavior changes.
4. Run the relevant frontend and backend checks before opening a review.
5. Update the appropriate documentation alongside infrastructure, API, or operational changes.

## Standards

- TypeScript uses strict mode.
- Python uses type hints and Ruff.
- Do not put business rules in API route handlers or React page components.
- Do not disable security checks merely to make a test pass.
- Do not commit secrets or generated dependency folders.

## Commit examples

`feat: add listing moderation workflow`

`fix: block cross-account listing edits`
`test: cover pending listing approval`
