#!/usr/bin/env bash
# CountCard beforeShellExecution hook: gate risky or production-affecting shell commands.
# Input: JSON with .command on stdin. Output: JSON with permission "allow" | "ask" | "deny".
set -e
input=$(cat)
command=$(node -e "try{const d=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log(d.command||'')}catch(e){console.log('')}" <<< "$input")

allow() {
  printf '%s\n' '{"continue": true, "permission": "allow"}'
}

ask() {
  msg="$1"
  escaped=$(node -e "console.log(JSON.stringify(process.argv[1]))" "$msg")
  printf '%s\n' "{\"continue\": true, \"permission\": \"ask\", \"user_message\": $escaped, \"agent_message\": $escaped}"
}

deny() {
  msg="$1"
  escaped=$(node -e "console.log(JSON.stringify(process.argv[1]))" "$msg")
  printf '%s\n' "{\"continue\": true, \"permission\": \"deny\", \"user_message\": $escaped, \"agent_message\": $escaped}"
}

# Destructive without scope: block
if [[ "$command" =~ rm[[:space:]]+-rf[[:space:]]+(/|\.\.|/etc|/usr|~\s) ]] || [[ "$command" =~ rm[[:space:]]+-rf[[:space:]]*$ ]]; then
  deny "Blocked: broad or unsafe rm -rf. Use a scoped path (e.g. .next, node_modules) and confirm with the user."
  exit 0
fi

# Production Firebase / deploy: ask
if [[ "$command" =~ firebase[[:space:]]+(deploy|release) ]] || [[ "$command" =~ firebase[[:space:]]+--project[[:space:]]+[^[:space:]]+[[:space:]]+deploy ]]; then
  ask "Firebase deploy or release requires approval. Confirm this is intended."
  exit 0
fi

# Writing env files or secrets: ask
if [[ "$command" =~ (echo|printf|cat)[[:space:]].*\.env ]] || [[ "$command" == *".env.local"* ]]; then
  ask "Writing to .env or .env.local may expose secrets. Confirm before proceeding."
  exit 0
fi

# Safe dev/lint/build: allow
if [[ "$command" =~ ^npm[[:space:]]+run[[:space:]]+(dev|lint|build|start) ]] \
   || [[ "$command" =~ ^npx[[:space:]] ]] \
   || [[ "$command" =~ ^(next|node|tsc)[[:space:]] ]]; then
  allow
  exit 0
fi

# Default: allow (no block)
allow
