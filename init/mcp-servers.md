# MCP Servers Configuration

## All MCP Servers (Connected ✓)

### 1. Web Search Prime
- **Type:** HTTP
- **URL:** https://api.z.ai/api/mcp/web_search_prime/mcp
- **Purpose:** Web search with filtering options
- **Tools:**
  - `mcp__web-search-prime__webSearchPrime`
- **Features:** Domain filtering, time range filtering, location-based results

### 2. Web Reader
- **Type:** HTTP
- **URL:** https://api.z.ai/api/mcp/web_reader/mcp
- **Purpose:** Fetch and convert web content to markdown
- **Tools:**
  - `mcp__web_reader__webReader`
- **Features:** Retain images, links summary, markdown conversion

### 3. ZRead (GitHub)
- **Type:** HTTP
- **URL:** https://api.z.ai/api/mcp/zread/mcp
- **Purpose:** Read GitHub repositories without cloning
- **Tools:**
  - `mcp__zread__get_repo_structure` - Get directory structure
  - `mcp__zread__read_file` - Read file contents
  - `mcp__zread__search_doc` - Search docs/issues/commits
- **Features:** Full repo access, search across documentation

### 4. ZAI MCP Server (Vision)
- **Type:** stdio (npx)
- **Package:** @z_ai/mcp-server
- **Purpose:** Image and video analysis
- **Tools:**
  - `mcp__zai-mcp-server__analyze_data_visualization` - Charts/graphs
  - `mcp__zai-mcp-server__analyze_image` - General image analysis
  - `mcp__zai-mcp-server__analyze_video` - Video content analysis
  - `mcp__zai-mcp-server__diagnose_error_screenshot` - Error diagnosis
  - `mcp__zai-mcp-server__extract_text_from_screenshot` - OCR
  - `mcp__zai-mcp-server__ui_diff_check` - UI comparison
  - `mcp__zai-mcp-server__ui_to_artifact` - UI to code/spec
  - `mcp__zai-mcp-server__understand_technical_diagram` - Diagram analysis

### 5. Klaviyo MCP
- **Type:** stdio (uvx)
- **Package:** klaviyo-mcp-server@latest
- **Purpose:** Klaviyo API integration for email marketing
- **Tools:**
  - `get_account_details` - Account info
  - `get_campaigns` / `create_campaign` - Campaign management
  - `get_campaign_report` - Campaign performance
  - `get_flows` / `get_flow` - Flow management
  - `get_flow_report` - Flow performance
  - `get_lists` / `get_segments` - Audience management
  - `get_profiles` / `create_profile` / `update_profile` - Profile CRUD
  - `subscribe_profile_to_marketing` - Subscribe profiles
  - `get_events` / `create_event` - Event tracking
  - `get_metrics` / `get_metric` - Metric data
  - `create_email_template` / `get_email_template` - Template management
- **Status:** ✓ Connected
- **Auth:** Private API Key configured

### 6. IDE MCP (Built-in with VS Code)
- **Type:** Built-in
- **Purpose:** IDE integration for code execution and diagnostics
- **Tools:**
  - `mcp__ide__executeCode` - Execute code in Jupyter kernel
  - `mcp__ide__getDiagnostics` - Get language diagnostics

### 7. Shopify Dev MCP
- **Type:** stdio (npx)
- **Package:** @shopify/dev-mcp
- **Purpose:** Shopify development documentation and API tools
- **Tools:**
  - `learn_shopify_api` - Learn about Shopify APIs
  - `search_shopify_docs` - Search Shopify documentation
  - `get_shopify_docs` - Get docs by path
  - `explore_graphql_schema` - Explore GraphQL schemas
  - `validate_graphql` - Validate GraphQL code
  - `validate_components` - Validate Shopify components
  - `validate_theme` - Validate theme directories
- **Status:** ✓ Connected
- **Auth:** No authentication required

### 6. 4.5V MCP (Image Analysis)
- **Type:** HTTP
- **Purpose:** Advanced AI vision for image analysis
- **Tools:**
  - `mcp__4_5v_mcp__analyze_image`

## Configuration Location

All MCP servers are configured in: `~/.claude.json`

## Authentication

All HTTP MCP servers use Bearer token authentication with the Z.AI API.

## Verification

Check MCP status anytime:
```bash
claude mcp list
```

## Adding New MCP Servers

```bash
# HTTP MCP
claude mcp add -s user -t http <name> <url> --header "Authorization: Bearer <token>"

# stdio MCP (via npx)
claude mcp add -s user -t stdio <name> npx -y <package>
```
