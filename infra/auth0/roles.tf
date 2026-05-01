resource "auth0_role" "platform_admin" {
  name        = "platform-admin"
  description = "Platform administrators for Team Chords"
}

resource "auth0_role" "support" {
  name        = "support"
  description = "Support staff for Team Chords"
}

