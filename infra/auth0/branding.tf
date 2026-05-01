resource "auth0_tenant" "teamchords" {
  friendly_name = var.friendly_name
  picture_url   = var.logo_url
  support_email = var.support_email
  support_url   = var.support_url

  allowed_logout_urls = local.tenant_allowed_logout_urls

  flags {
    enable_client_connections = true
  }
}

resource "auth0_branding" "teamchords" {
  logo_url    = var.logo_url
  favicon_url = var.logo_url
}

