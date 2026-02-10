# All Available Tools

## Core File Operations

| Tool | Description |
|------|-------------|
| `Read` | Read files from filesystem |
| `Write` | Write new files |
| `Edit` | Edit existing files (exact string replacement) |
| `Glob` | File pattern matching |
| `Grep` | Content search (ripgrep-based) |

## Terminal & Execution

| Tool | Description |
|------|-------------|
| `Bash` | Execute bash commands (git, npm, etc.) |
| `NotebookEdit` | Edit Jupyter notebook cells |

## Task Management

| Tool | Description |
|------|-------------|
| `Task` | Launch specialized agents (Bash, Explore, Plan, etc.) |
| `TaskCreate` | Create new tasks |
| `TaskGet` | Get task details by ID |
| `TaskUpdate` | Update task status/details |
| `TaskList` | List all tasks |
| `TaskOutput` | Get output from background tasks |
| `TaskStop` | Stop running tasks |

## User Interaction

| Tool | Description |
|------|-------------|
| `AskUserQuestion` | Ask user questions with options |
| `EnterPlanMode` | Enter planning mode for complex tasks |
| `ExitPlanMode` | Exit planning mode and request approval |
| `Skill` | Execute user-invocable skills |

## Web & Research

| Tool | Description |
|------|-------------|
| `WebSearch` | Web search (built-in) |
| `mcp__web-search-prime__webSearchPrime` | Advanced web search with filters |
| `mcp__web_reader__webReader` | Fetch web content as markdown |

## GitHub Integration

| Tool | Description |
|------|-------------|
| `mcp__zread__get_repo_structure` | Get GitHub repo directory structure |
| `mcp__zread__read_file` | Read GitHub file contents |
| `mcp__zread__search_doc` | Search GitHub docs/issues/commits |

## Image & Video Analysis

| Tool | Description |
|------|-------------|
| `mcp__4_5v_mcp__analyze_image` | Advanced AI vision analysis |
| `mcp__zai-mcp-server__analyze_image` | General image analysis |
| `mcp__zai-mcp-server__analyze_video` | Video content analysis |
| `mcp__zai-mcp-server__analyze_data_visualization` | Charts/graphs analysis |
| `mcp__zai-mcp-server__diagnose_error_screenshot` | Error diagnosis from screenshots |
| `mcp__zai-mcp-server__extract_text_from_screenshot` | OCR text extraction |
| `mcp__zai-mcp-server__ui_diff_check` | UI comparison (expected vs actual) |
| `mcp__zai-mcp-server__ui_to_artifact` | Convert UI to code/spec/prompt |
| `mcp__zai-mcp-server__understand_technical_diagram` | Technical diagram analysis |

## IDE Integration

| Tool | Description |
|------|-------------|
| `mcp__ide__executeCode` | Execute code in Jupyter kernel |
| `mcp__ide__getDiagnostics` | Get VS Code language diagnostics |

## Usage Notes

- All tools are pre-approved and won't ask for permission
- Dangerous commands (rm -rf, git push --force, etc.) still require confirmation
- Use `Glob` and `Grep` for file searching instead of bash find/grep
- Use `Read` instead of cat/head/tail
- Use `Edit` instead of sed/awk

## BMad Skills (Development Workflow)

These are invoked via `/skillname` or the `Skill` tool:
- `bmad-bmm-create-prd` - Create PRDs
- `bmad-bmm-create-architecture` - Architecture decisions
- `bmad-bmm-create-epics-and-stories` - Create epics/stories
- `bmad-bmm-dev-story` - Execute a story
- `bmad-bmm-code-review` - Adversarial code review
- And many more...

Use `/help` in Claude Code to see all available skills.
