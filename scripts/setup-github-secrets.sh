#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"
KEY_FILE="$REPO_ROOT/gcp-sa-key.json"
REPO="${GH_REPO:-}"

usage() {
  cat <<'EOF'
Usage: setup-github-secrets.sh [options]

Options:
  -r, --repo <owner/repo>    GitHub repository to target
  -e, --env-file <path>      Path to the local .env file
  -k, --key-file <path>      Path to the GCP service account JSON key file
  -h, --help                 Show this help text

The script uploads values from .env into GitHub repository secrets and
uploads gcp-sa-key.json as GCP_SA_KEY.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -r|--repo)
      REPO="${2:-}"
      shift 2
      ;;
    -e|--env-file)
      ENV_FILE="${2:-}"
      shift 2
      ;;
    -k|--key-file)
      KEY_FILE="${2:-}"
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

if [[ -z "$REPO" ]]; then
  if ! gh repo view >/dev/null 2>&1; then
    echo "Error: supply --repo owner/repo or set GH_REPO." >&2
    exit 1
  fi
  REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: .env file not found at $ENV_FILE" >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

secret_names=(
  GCP_PROJECT_ID
  NEON_POSTGRES_CS
  UPSTASH_REDIS_CS
  AUTH0_DOMAIN
  AUTH0_AUDIENCE
  AUTH0_CLIENT_ID
  AUTH0_CLIENT_SECRET
  WEB_AUTH0_DOMAIN
  WEB_AUTH0_CLIENT_ID
  WEB_AUTH0_AUDIENCE
  ADMIN_AUTH0_DOMAIN
  ADMIN_AUTH0_CLIENT_ID
  ADMIN_AUTH0_AUDIENCE
  CUSTOMER_APP_BASE_URL
  WEB_APP_BASE_URL
  DODO_SECRET_KEY
  DODO_BASE_URL
  DODO_WEBHOOK_SECRET
  CHATWOOT_BASE_URL
  CHATWOOT_WEBSITE_TOKEN
  ZEPTOMAIL_API_KEY
  ZEPTOMAIL_TEMPLATE_KEY
  ZEPTOMAIL_FROM_EMAIL_ADDRESS
  ZEPTOMAIL_FROM_NAME
  ZEPTOMAIL_BASE_URL
)

missing=()
for secret_name in "${secret_names[@]}"; do
  secret_value="${!secret_name:-}"
  if [[ -z "$secret_value" ]]; then
    missing+=("$secret_name")
    continue
  fi

  printf '%s' "$secret_value" | gh secret set -R "$REPO" "$secret_name" >/dev/null
  echo "Set secret: $secret_name"
done

if (( ${#missing[@]} > 0 )); then
  printf 'Missing values in %s:\n' "$ENV_FILE" >&2
  printf '  - %s\n' "${missing[@]}" >&2
  exit 1
fi

if [[ ! -f "$KEY_FILE" ]]; then
  echo "Error: GCP service account key file not found at $KEY_FILE" >&2
  exit 1
fi

gh secret set -R "$REPO" GCP_SA_KEY < "$KEY_FILE" >/dev/null
echo "Set secret: GCP_SA_KEY"

echo "Done. GitHub secrets are ready for $REPO."

