resource "auth0_action" "register_teamchords" {
  name    = "Register to Team Chords API"
  runtime = var.auth0_actions_runtime
  deploy  = true
  code    = file("${path.module}/actions/register-teamchords.js")

  supported_triggers {
    id      = "post-login"
    version = var.post_login_trigger_version
  }

  dependencies {
    name    = "axios"
    version = "1.8.4"
  }

  secrets {
    name  = "TEAMCHORDS_API_BASE_URL"
    value = local.api_base_url
  }

  secrets {
    name  = "TEAMCHORDS_API_SYNC_SECRET"
    value = var.api_sync_secret
  }
}

resource "auth0_action" "add_role_claims" {
  name    = "Add Role to Token"
  runtime = var.auth0_actions_runtime
  deploy  = true
  code    = file("${path.module}/actions/add-role-claims.js")

  supported_triggers {
    id      = "post-login"
    version = var.post_login_trigger_version
  }

  secrets {
    name  = "ROLES_NAMESPACE"
    value = var.roles_namespace
  }
}

resource "auth0_trigger_actions" "post_login" {
  trigger = "post-login"

  actions {
    id           = auth0_action.register_teamchords.id
    display_name = auth0_action.register_teamchords.name
  }

  actions {
    id           = auth0_action.add_role_claims.id
    display_name = auth0_action.add_role_claims.name
  }
}


