terraform {
  required_version = ">= 1.8.0"

  required_providers {
    auth0 = {
      source  = "auth0/auth0"
      version = "~> 1.45"
    }
  }

  backend "gcs" {
    bucket = "teamchords-tfstate"
    prefix = "auth0"
  }
}

