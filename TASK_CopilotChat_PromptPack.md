# Copilot Chat – Best Prompts Pack (Editor, CI, Devcontainers, Cost Optimization)

How to use
- Open Copilot Chat and paste any prompt below.
- Replace placeholders like <repo>, <path>, <goal>, <limit>.
- Keep messages short; ask for a plan first, then iterate.

## 1) Project analysis and plan
"You are my pair programmer. Analyze this workspace and identify tech stacks (Node/Python/Rust/Solidity), build/test commands, and CI/devcontainer gaps. Propose a step-by-step plan to:
- minimize GitHub Actions minutes and storage
- keep Codespaces cost at $0 with autosuspend
- add a minimal devcontainer
- add a cost‑efficient CI workflow with filtered paths, fetch-depth: 1, caching, and 10–15 min timeouts
Return: a prioritized checklist per repo with concrete file changes."

## 2) Minimal CI workflow per stack
"Generate a minimal GitHub Actions CI workflow for this project with:
- push/pull_request on branches [main, master]
- filtered paths for src/lib/app/backend/server/client/public
- concurrency cancellation
- shallow checkout (fetch-depth: 1)
- cache dependencies
- Node job if package.json exists (npm ci, build if present, tests if present)
- Python job if requirements.txt exists (pip cache, pytest -q || true)
- Rust job if Cargo.lock exists (cache cargo, build/test locked)
Keep total runtime under 15 minutes and provide the final YAML."

## 3) Devcontainer minimal
"Create a minimal devcontainer.json for this repo:
- base image (Node 20, Python 3.11, Rust stable, or Ubuntu base as appropriate)
- no heavy postCreate commands (use 'true')
- VS Code extensions only for the detected stack
- editor defaults: formatOnSave and autoSave on focus change
Return the final devcontainer.json."

## 4) VS Code editor smart settings
"Produce a .vscode/settings.json that:
- enables formatOnSave
- sets Prettier as default formatter for TS/JS
- organizes imports and fixAll on save
- enables inline Copilot suggestions
Return the final JSON."

## 5) Branch protection guidance (post GitHub Pro)
"Outline exact steps in GitHub Settings to add branch protection rules on main/master:
- require PR before merging
- require status checks 'CI' to pass
- require code owner reviews
- dismiss stale approvals on new commits
Include the UI click path and caveats."

## 6) Cost optimization audit (use our CSV)
"I will paste a usage CSV. Analyze Actions minutes, storage, Codespaces compute/storage, and Copilot premium requests. Recommend changes to keep metered costs at $0. Return a prioritized action list."

## 7) Generate fast tests
"Infer testing strategy and generate fast, deterministic unit tests for critical modules. Prefer minimal dependencies and skip heavy integrations. Return test files and commands."
