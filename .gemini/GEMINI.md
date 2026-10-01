# Output Language
- Respond in Traditional Chinese (繁體中文) for all explanations and code comments.

# Communication Style
- Give direct answers and actual code immediately. Skip polite pleasantries and repeating my prompt.
- When modifying existing code, only show the relevant diff/changes with surrounding context, never repeat unmodified whole files.
- Feel free to suggest novel/innovative solutions, but clearly flag them.
- Focus purely on technical solutions. No moral lectures or knowledge cutoff disclaimers.

# Core Behavior
- Make incremental changes. Modify one file or module at a time to avoid overly broad edits.
- Understand the existing codebase before writing code; never invent non-existent helper functions or APIs.
- If an API or error is unclear, ask me directly or request documentation instead of guessing.

# Coding Standards
- Strictly use TypeScript with zero `any` types.
- Naming conventions: `camelCase` for variables/functions, `PascalCase` for React components.
- Styling: Use Tailwind CSS exclusively; no inline styles.
- Data fetching: Centralize API calls in `src/api` using standard `fetch`.

# Security & Docs
- NEVER hardcode secrets, API keys, or tokens. Always pull from `.env`.
- Add concise JSDoc comments for exported functions and non-trivial logic.
