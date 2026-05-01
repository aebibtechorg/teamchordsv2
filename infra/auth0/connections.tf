resource "auth0_connection" "database" {
  name     = var.database_connection_name
  strategy = "auth0"

  options {
    disable_signup  = false
    password_policy = "good"
  }
}

resource "auth0_connection_clients" "database" {
  connection_id = auth0_connection.database.id
  enabled_clients = [
    auth0_client.customer_spa.client_id,
    auth0_client.admin_spa.client_id,
  ]
}

resource "auth0_connection" "google" {
  name           = "google-oauth2"
  display_name   = "Google"
  strategy       = "google-oauth2"
  show_as_button = true

  options {
    client_id     = var.google_oauth_client_id
    client_secret = var.google_oauth_client_secret
    scopes        = ["email", "profile"]
  }
}

resource "auth0_connection_clients" "google" {
  connection_id = auth0_connection.google.id
  enabled_clients = [
    auth0_client.customer_spa.client_id,
  ]
}

