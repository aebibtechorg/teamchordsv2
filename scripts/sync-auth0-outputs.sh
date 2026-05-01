#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
AUTH0_DIR="$REPO_ROOT/infra/auth0"
ENV_FILE="$REPO_ROOT/.env"

usage() {
  cat <<'EOF'
Usage: sync-auth0-outputs.sh [options]

Options:
  -a, --auth0-dir <path>     Path to the Auth0 Terraform stack
  -e, --env-file <path>      Path to the local .env file to update
  -h, --help                 Show this help text

The script reads `terraform output -json` from the Auth0 stack and updates the
Auth0-related keys in the target .env file used by scripts/setup-github-secrets.sh.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -a|--auth0-dir)
      AUTH0_DIR="${2:-}"
      shift 2
      ;;
    -e|--env-file)
      ENV_FILE="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ ! -d "$AUTH0_DIR" ]]; then
  echo "Error: Auth0 Terraform directory not found at $AUTH0_DIR" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: .env file not found at $ENV_FILE" >&2
  exit 1
fi

if ! command -v terraform >/dev/null 2>&1; then
  echo "Error: terraform is required but was not found in PATH." >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "Error: python3 is required but was not found in PATH." >&2
  exit 1
fi

if ! terraform_output_json="$(cd "$AUTH0_DIR" && terraform output -json)"; then
  echo "Error: failed to read Auth0 Terraform outputs from $AUTH0_DIR." >&2
  echo "Make sure the stack has been initialized and applied, or imported if the tenant already exists." >&2
  exit 1
fi

export TERRAFORM_OUTPUT_JSON="$terraform_output_json"

python3 - "$ENV_FILE" <<'PY'
import json
import os
import re
import sys
from pathlib import Path

env_file = Path(sys.argv[1])
outputs = json.loads(os.environ["TERRAFORM_OUTPUT_JSON"])

key_to_output = {
    "AUTH0_DOMAIN": "auth0_domain",
    "AUTH0_AUDIENCE": "auth0_audience",
    "AUTH0_CLIENT_ID": "auth0_client_id",
    "AUTH0_CLIENT_SECRET": "auth0_client_secret",
    "WEB_AUTH0_DOMAIN": "web_auth0_domain",
    "WEB_AUTH0_CLIENT_ID": "web_auth0_client_id",
    "WEB_AUTH0_AUDIENCE": "web_auth0_audience",
    "ADMIN_AUTH0_DOMAIN": "admin_auth0_domain",
    "ADMIN_AUTH0_CLIENT_ID": "admin_auth0_client_id",
    "ADMIN_AUTH0_AUDIENCE": "admin_auth0_audience",
}

missing_outputs = [name for name in key_to_output.values() if name not in outputs or "value" not in outputs[name]]
if missing_outputs:
    print(
        "Error: missing required Auth0 Terraform outputs: " + ", ".join(missing_outputs),
        file=sys.stderr,
    )
    sys.exit(1)

values = {}
for env_key, output_name in key_to_output.items():
    value = outputs[output_name]["value"]
    values[env_key] = "" if value is None else str(value)


def quote_env_value(value: str) -> str:
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'

assignment_pattern = re.compile(r"^([A-Z0-9_]+)=.*$")
lines = env_file.read_text().splitlines(keepends=True)
updated_lines = []
seen_keys = set()

for line in lines:
    match = assignment_pattern.match(line)
    if match:
        key = match.group(1)
        if key in values:
            updated_lines.append(f"{key}={quote_env_value(values[key])}\n")
            seen_keys.add(key)
            continue

    updated_lines.append(line)

for key in key_to_output:
    if key not in seen_keys:
        updated_lines.append(f"{key}={quote_env_value(values[key])}\n")

env_file.write_text("".join(updated_lines))

for key in key_to_output:
    print(f"Synced {key}")
PY

unset TERRAFORM_OUTPUT_JSON

echo "Updated Auth0 values in $ENV_FILE from Terraform outputs in $AUTH0_DIR."



