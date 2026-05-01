resource "auth0_client" "customer_spa" {
  name        = var.customer_app_name
  description = "Customer-facing React SPA for Team Chords"
  app_type    = "spa"

  callbacks           = local.customer_callbacks
  allowed_logout_urls = local.customer_logout_urls
  allowed_origins     = [local.customer_app_origin]
  web_origins         = [local.customer_app_origin]
  oidc_conformant     = true
  logo_uri            = var.logo_url
}

resource "auth0_client" "admin_spa" {
  name        = var.admin_app_name
  description = "Admin React SPA for Team Chords"
  app_type    = "spa"

  callbacks           = local.admin_callbacks
  allowed_logout_urls = local.admin_logout_urls
  allowed_origins     = [local.admin_app_origin]
  web_origins         = [local.admin_app_origin]
  oidc_conformant     = true
  logo_uri            = var.logo_url
}

resource "auth0_client" "api_management" {
  name        = var.backend_m2m_app_name
  description = "Machine-to-machine application used by the Team Chords API to call the Auth0 Management API"
  app_type    = "non_interactive"

  grant_types     = ["client_credentials"]
  oidc_conformant = true
  logo_uri        = var.logo_url
}

resource "auth0_client_credentials" "api_management" {
  client_id = auth0_client.api_management.client_id
}

resource "auth0_client_grant" "api_management_auth0_management_api" {
  client_id = auth0_client.api_management.client_id
  audience  = local.management_api_audience
  scopes    = var.management_api_scopes
}

