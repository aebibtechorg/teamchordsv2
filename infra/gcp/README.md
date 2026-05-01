# Google Cloud Infrastructure

This Terraform stack provisions the Google Cloud resources TeamChords needs to run without clicking through the console:

- Required GCP APIs
- Artifact Registry for container images
- Workload Identity Federation for GitHub Actions
- Runtime service accounts for the API, web app, and admin app
- Cloud Run services for the API, web app, and admin app

## Required inputs

Set these values through `TF_VAR_*` environment variables, a `.tfvars` file, or your CI pipeline:

- `project_id`
- `region`
- `github_owner`
- `github_repo`
- `teamchords_connection_string`
- `redis_connection_string`
- `azure_signalr_connection_string`
- `auth0_domain`
- `auth0_audience`
- `auth0_client_id`
- `auth0_client_secret`
- `web_auth0_domain`
- `web_auth0_client_id`
- `web_auth0_audience`
- `admin_auth0_domain`
- `admin_auth0_client_id`
- `admin_auth0_audience`
- `customer_app_base_url`
- `web_app_base_url`
- `dodo_secret_key`
- `dodo_webhook_secret`
- `zeptomail_api_key`
- `zeptomail_template_key`
- `zeptomail_from_email_address`

Optional values:

- `api_image`
- `web_image`
- `admin_image`
- `dodo_base_url`
- `chatwoot_base_url`
- `chatwoot_website_token`
- `chatwoot_position`
- `chatwoot_hide_message_bubble`
- `chatwoot_locale`
- `zeptomail_from_name`
- `zeptomail_base_url`

## Local bootstrap

1. Authenticate to Google Cloud with a principal that can create buckets and services.
2. Create the Terraform state bucket if it does not exist.
3. Initialize Terraform with the GCS backend.
4. Apply the stack.
5. Capture `terraform output -raw api_url` and provide it to the web build as `VITE_API_BASE_URL` so the SignalR client can connect to the API origin directly.

## GitHub secrets bootstrap

The repo root contains a local `.env` template with the values used by the deployment workflow. Fill in the blanks on your machine, keep `gcp-sa-key.json` next to it, and then upload everything into GitHub secrets with the helper script:

```bash
gh auth login
chmod +x scripts/setup-github-secrets.sh
scripts/setup-github-secrets.sh -r <owner>/<repo>
```

If you prefer to target a different `.env` or key file, pass `--env-file` and `--key-file`.

Example:

```bash
cd infra/gcp

export TF_VAR_project_id="your-project-id"
export TF_VAR_region="us-central1"
export TF_VAR_github_owner="your-github-org-or-user"
export TF_VAR_github_repo="teamchordsv2"
export TF_VAR_teamchords_connection_string="..."
export TF_VAR_redis_connection_string="..."
export TF_VAR_azure_signalr_connection_string="..."
export TF_VAR_auth0_domain="..."
export TF_VAR_auth0_audience="..."
export TF_VAR_auth0_client_id="..."
export TF_VAR_auth0_client_secret="..."
export TF_VAR_web_auth0_domain="..."
export TF_VAR_web_auth0_client_id="..."
export TF_VAR_web_auth0_audience="..."
export TF_VAR_admin_auth0_domain="..."
export TF_VAR_admin_auth0_client_id="..."
export TF_VAR_admin_auth0_audience="..."
export TF_VAR_customer_app_base_url="..."
export TF_VAR_web_app_base_url="..."
export TF_VAR_dodo_secret_key="..."
export TF_VAR_dodo_base_url="..."
export TF_VAR_dodo_webhook_secret="..."
export TF_VAR_zeptomail_api_key="..."
export TF_VAR_zeptomail_template_key="..."
export TF_VAR_zeptomail_from_email_address="..."
export TF_VAR_zeptomail_from_name="..."
export TF_VAR_zeptomail_base_url="..."

terraform init -backend-config="bucket=your-project-id-tcv2-tfstate" -backend-config="prefix=gcp"
terraform apply
terraform output -raw api_url
```

### Azure SignalR

Provision an Azure SignalR Service instance manually and copy its connection string into `TF_VAR_azure_signalr_connection_string` / the `AZURE_SIGNALR_CONNECTION_STRING` GitHub secret used by the deploy workflow.

The API prefers Azure SignalR when that connection string is present, then falls back to Redis, then finally in-memory SignalR.

The web client reads `VITE_API_BASE_URL` at build time so the SignalR browser client can negotiate against the API origin directly, which keeps Firebase Hosting out of the WebSocket path.

## GitHub Actions

The deployment workflow uses the same Terraform stack to provision and update the runtime resources, while GitHub Actions builds and pushes the container images first.

