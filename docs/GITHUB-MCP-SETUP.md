# GitHub MCP Server Setup Guide

## Status
✅ **Token Verified**: Your GitHub token is valid and authenticated as `kostyc`

## Configuration Steps

### Method 1: Through Cursor Settings UI (Recommended)

1. **Open Cursor Settings**:
   - Press `Cmd + ,` (or Cursor → Settings)
   - Search for "MCP" or "Model Context Protocol"

2. **Add GitHub MCP Server**:
   - Click "Add Server" or the "+" button
   - Configure with the following:

   **Server Name**: `github`

   **Command**: `npx`

   **Arguments**: 
   ```
   -y
   @modelcontextprotocol/server-github
   ```

   **Environment Variables**:
   ```
   GITHUB_PERSONAL_ACCESS_TOKEN=YOUR_GITHUB_PERSONAL_ACCESS_TOKEN
   ```

3. **Save and Restart Cursor**:
   - Save the configuration
   - Completely quit Cursor (Cmd + Q)
   - Reopen Cursor

4. **Verify**:
   - After restart, the GitHub MCP should be available
   - You can test by asking the AI to list MCP resources

### Method 2: Manual Configuration File

If the UI method doesn't work, you can manually create/edit the MCP configuration file:

**Location**: `~/Library/Application Support/Cursor/User/mcp.json`

**Content**:
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_GITHUB_PERSONAL_ACCESS_TOKEN"
      }
    }
  }
}
```

**Note**: After creating/editing this file, restart Cursor completely.

## Troubleshooting

### If MCP Still Doesn't Work:

1. **Check Token Permissions**:
   - Go to https://github.com/settings/tokens
   - Verify your token has the required scopes:
     - `repo` (for repository access)
     - `read:org` (for organization access)
     - `read:user` (for user information)

2. **Check Cursor Logs**:
   - Open Cursor → Help → Toggle Developer Tools
   - Check Console for MCP-related errors
   - Look for MCP logs in: `~/Library/Application Support/Cursor/logs/`

3. **Verify npx is Available**:
   ```bash
   which npx
   npx --version
   ```
   If npx is not found, install Node.js/npm

4. **Test Token Manually**:
   ```bash
   curl -H "Authorization: token YOUR_GITHUB_PERSONAL_ACCESS_TOKEN" \
        https://api.github.com/user
   ```
   Should return your GitHub user information

## Security Notes

⚠️ **Important**: 
- Never commit your GitHub token to version control
- The token is stored in Cursor's local configuration
- If you need to revoke the token, go to https://github.com/settings/tokens
- Consider using a token with minimal required permissions

## Verification

After setup, you should be able to:
- List GitHub repositories
- Create pull requests
- Access GitHub issues
- View repository information
- And other GitHub operations through MCP
