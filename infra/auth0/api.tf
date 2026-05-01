resource "auth0_resource_server" "teamchords_api" {
  name       = "Team Chords API"
  identifier = var.api_audience

  signing_alg                                     = "RS256"
  skip_consent_for_verifiable_first_party_clients = true
}

