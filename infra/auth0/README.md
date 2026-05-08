# Auth0 Infrastructure

This Terraform stack manages the Team Chords Auth0 tenant configuration separately from Google Cloud runtime infrastructure.

It provisions:

- The Team Chords API resource server / audience
- Customer and admin Auth0 applications
- A machine-to-machine client for the API to call the Auth0 Management API
- Tenant branding, support email, and support URL
- Roles: `platform-admin` and `support`
- Database and Google connections
- Two `post-login` actions:
  - sync first-time users with `POST /api/users/auth0-sync`
  - add role claims to the ID token and access token under `https://teamchordsapp.io/roles`

## Runtime contract with the existing apps

This stack is aligned with the current codebase:

- [`tcv2.Api/Program.cs`](../../tcv2.Api/Program.cs) expects the custom role claim `https://teamchordsapp.io/roles`
- [`tcv2.Api/Endpoints/UserEndpoints.cs`](../../tcv2.Api/Endpoints/UserEndpoints.cs) still exposes `/api/users/googlesignin` as a legacy compatibility path, but Auth0 now syncs new users through `/api/users/auth0-sync`
- [`tcv2.Api/Endpoints/UserEndpoints.cs`](../../tcv2.Api/Endpoints/UserEndpoints.cs) now also exposes a secret-protected Auth0 sync endpoint at `/api/users/auth0-sync`
- [`web/src/main.jsx`](../../web/src/main.jsx) uses a customer SPA callback at `/callback`
- [`web/src/router.jsx`](../../web/src/router.jsx) also supports `/auth/callback`
- [`admin/src/lib/admin-auth.tsx`](../../admin/src/lib/admin-auth.tsx) uses `/dashboard` as the admin redirect target
- [`web/src/pages/UpdatePassword.jsx`](../../web/src/pages/UpdatePassword.jsx) expects the database connection name `Username-Password-Authentication`

## Required inputs

Set these through `TF_VAR_*` environment variables, a `.tfvars` file, or your CI pipeline:

- `auth0_domain`
- `auth0_management_client_id`
- `auth0_management_client_secret`
- `api_audience`
- `api_base_url`
- `customer_app_base_url`
- `admin_app_base_url`
- `google_oauth_client_id`
- `google_oauth_client_secret`
- `api_sync_secret`

Optional values:

- `friendly_name`
- `logo_url`
- `support_email`
- `support_url`
- `customer_app_name`
- `admin_app_name`
- `backend_m2m_app_name`
- `roles_namespace`
- `auth0_actions_runtime`
- `post_login_trigger_version`
- `management_api_scopes`
- `customer_extra_callbacks`
- `customer_extra_logout_urls`
- `admin_extra_callbacks`
- `admin_extra_logout_urls`

A starter file is included at [`terraform.tfvars.example`](./terraform.tfvars.example).

## GitHub Actions

This repo also includes a dedicated Auth0 deployment workflow in `.github/workflows/`.

- Pull requests touching `infra/auth0/**` run `terraform fmt`, `init`, `validate`, and `plan`
- Pushes to `main` touching `infra/auth0/**` run the same checks and then apply automatically
- Manual runs can plan only or apply by setting the `apply` workflow input
- Apply-capable runs also upload a non-sensitive review artifact containing safe outputs such as domains, audiences, client IDs, connection names, and role IDs

Required GitHub secrets for that workflow:

- `GCP_PROJECT_ID`
- `GCP_SA_KEY`
- `GH_SECRETS_ADMIN_TOKEN`
- `AUTH0_DOMAIN`
- `AUTH0_AUDIENCE`
- `AUTH0_MANAGEMENT_CLIENT_ID`
- `AUTH0_MANAGEMENT_CLIENT_SECRET`
- `API_BASE_URL`
- `CUSTOMER_APP_BASE_URL`
- `ADMIN_APP_BASE_URL`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `AUTH0_SYNC_SECRET`

The repo-root [`.env`](../../.env) template and [`scripts/setup-github-secrets.sh`](../../scripts/setup-github-secrets.sh) now include these values.

After an apply-capable Auth0 workflow run, the workflow automatically syncs the runtime Auth0 outputs back into this repository's GitHub secrets for:

- `AUTH0_DOMAIN`
- `AUTH0_AUDIENCE`
- `AUTH0_CLIENT_ID`
- `AUTH0_CLIENT_SECRET`
- `WEB_AUTH0_DOMAIN`
- `WEB_AUTH0_CLIENT_ID`
- `WEB_AUTH0_AUDIENCE`
- `ADMIN_AUTH0_DOMAIN`
- `ADMIN_AUTH0_CLIENT_ID`
- `ADMIN_AUTH0_AUDIENCE`

That means the API and clients can pick up new Auth0 values on the next GCP deployment without a manual local secret refresh step.

You can also generate the same non-sensitive review artifact locally:

```bash
cd /Users/paul/Desktop/teamchordsv2

python3 scripts/export-auth0-review-artifact.py \
  --auth0-dir infra/auth0 \
  --output-dir /tmp/auth0-review-artifact
```

That bundle contains:

- `auth0-outputs.json`
- `auth0-outputs.env`
- `README.md`

Sensitive outputs such as `auth0_client_secret` are excluded by design.

## Example local run

```bash
cd infra/auth0

export TF_VAR_auth0_domain="your-tenant.us.auth0.com"
export TF_VAR_auth0_management_client_id="your-management-m2m-client-id"
export TF_VAR_auth0_management_client_secret="your-management-m2m-client-secret"
export TF_VAR_api_audience="https://api.teamchords.com"
export TF_VAR_api_base_url="https://api-tc2.aebibtech.com"
export TF_VAR_customer_app_base_url="https://teamchords.com"
export TF_VAR_admin_app_base_url="https://admin.teamchords.com"
export TF_VAR_google_oauth_client_id="your-google-client-id"
export TF_VAR_google_oauth_client_secret="your-google-client-secret"

terraform init -backend-config="bucket=your-project-id-tcv2-tfstate" -backend-config="prefix=auth0"
terraform plan -out=tfplan
terraform apply tfplan
```

## Outputs to feed into the GCP stack

After applying this stack, either copy these outputs manually into the existing GCP deploy secrets or sync them into the repo-root [`.env`](../../.env) file with [`scripts/sync-auth0-outputs.sh`](../../scripts/sync-auth0-outputs.sh):

- `auth0_domain` -> `AUTH0_DOMAIN`, `WEB_AUTH0_DOMAIN`, `ADMIN_AUTH0_DOMAIN`
- `auth0_audience` -> `AUTH0_AUDIENCE`, `WEB_AUTH0_AUDIENCE`, `ADMIN_AUTH0_AUDIENCE`
- `auth0_client_id` -> `AUTH0_CLIENT_ID`
- `auth0_client_secret` -> `AUTH0_CLIENT_SECRET`
- `web_auth0_client_id` -> `WEB_AUTH0_CLIENT_ID`
- `admin_auth0_client_id` -> `ADMIN_AUTH0_CLIENT_ID`

Example:

```bash
cd infra/auth0

terraform output -raw auth0_domain
terraform output -raw auth0_audience
terraform output -raw auth0_client_id
terraform output -raw auth0_client_secret
terraform output -raw web_auth0_client_id
terraform output -raw admin_auth0_client_id
```

Or sync the Auth0-related GitHub secret values automatically:

```bash
cd /Users/paul/Desktop/teamchordsv2

chmod +x scripts/sync-auth0-outputs.sh
scripts/sync-auth0-outputs.sh
```

If you need to refresh GitHub secrets manually from your machine instead of using the Auth0 CI workflow, upload the refreshed `.env` values with:

```bash
chmod +x scripts/setup-github-secrets.sh
scripts/setup-github-secrets.sh --sync-auth0 -r <owner>/<repo>
```

## Notes

- Google sign-in is enabled only for the customer app.
- The Team Chords registration action runs for first-time logins (`event.stats.logins_count === 1`) and calls the secret-protected `/api/users/auth0-sync` endpoint.
- The customer app still uses the database connection `Username-Password-Authentication` for email/password signup and reset flows.
- If your Auth0 tenant does not yet support `node22` for Actions, override `TF_VAR_auth0_actions_runtime` with a runtime your tenant supports.

## Existing tenant migration note

If this Auth0 tenant already has manually-created applications, connections, roles, or Actions, import them into Terraform state before applying to avoid duplicate-resource errors. Typical examples:

```bash
cd infra/auth0

terraform import auth0_client.customer_spa <auth0-client-id>
terraform import auth0_client.admin_spa <auth0-client-id>
terraform import auth0_client.api_management <auth0-client-id>
terraform import auth0_connection.database <connection-id>
terraform import auth0_connection.google <connection-id>
terraform import auth0_role.platform_admin <role-id>
terraform import auth0_role.support <role-id>
```

The exact IDs come from the Auth0 dashboard or Management API. On a brand-new tenant, no imports are needed.



