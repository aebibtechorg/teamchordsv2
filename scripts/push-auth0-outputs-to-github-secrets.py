#!/usr/bin/env python3
import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

OUTPUT_TO_SECRET = {
    "auth0_domain": ("AUTH0_DOMAIN", False),
    "auth0_audience": ("AUTH0_AUDIENCE", False),
    "auth0_client_id": ("AUTH0_CLIENT_ID", False),
    "auth0_client_secret": ("AUTH0_CLIENT_SECRET", True),
    "web_auth0_domain": ("WEB_AUTH0_DOMAIN", False),
    "web_auth0_client_id": ("WEB_AUTH0_CLIENT_ID", False),
    "web_auth0_audience": ("WEB_AUTH0_AUDIENCE", False),
    "admin_auth0_domain": ("ADMIN_AUTH0_DOMAIN", False),
    "admin_auth0_client_id": ("ADMIN_AUTH0_CLIENT_ID", False),
    "admin_auth0_audience": ("ADMIN_AUTH0_AUDIENCE", False),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Push Auth0 Terraform outputs into GitHub repository secrets."
    )
    parser.add_argument(
        "--auth0-dir",
        default=str(Path(__file__).resolve().parents[1] / "infra" / "auth0"),
        help="Path to the Auth0 Terraform stack",
    )
    parser.add_argument(
        "--repo",
        required=True,
        help="GitHub repository in owner/name format",
    )
    return parser.parse_args()


def require_command(name: str) -> None:
    if shutil.which(name) is None:
        raise RuntimeError(f"Required command not found in PATH: {name}")


def load_outputs(auth0_dir: Path) -> dict:
    result = subprocess.run(
        ["terraform", "output", "-json"],
        cwd=auth0_dir,
        capture_output=True,
        text=True,
        check=False,
    )

    if result.returncode != 0:
        sys.stderr.write(result.stderr)
        raise RuntimeError(
            f"Failed to read Terraform outputs from {auth0_dir}. Ensure the stack is initialized and applied."
        )

    return json.loads(result.stdout)


def validate_outputs(raw_outputs: dict) -> dict[str, str]:
    missing = [
        output_name
        for output_name in OUTPUT_TO_SECRET
        if output_name not in raw_outputs or "value" not in raw_outputs[output_name]
    ]
    if missing:
        raise RuntimeError(
            "Missing required Auth0 Terraform outputs: " + ", ".join(missing)
        )

    values: dict[str, str] = {}
    for output_name, (_, allow_sensitive) in OUTPUT_TO_SECRET.items():
        metadata = raw_outputs[output_name]
        if metadata.get("sensitive") and not allow_sensitive:
            raise RuntimeError(
                f"Output {output_name} is marked sensitive and is not allowed to sync automatically."
            )

        value = metadata.get("value")
        values[output_name] = "" if value is None else str(value)

    return values


def set_secret(repo: str, secret_name: str, secret_value: str) -> None:
    result = subprocess.run(
        ["gh", "secret", "set", "-R", repo, secret_name],
        input=secret_value,
        text=True,
        capture_output=True,
        check=False,
    )

    if result.returncode != 0:
        sys.stderr.write(result.stderr)
        raise RuntimeError(f"Failed to set GitHub secret {secret_name} for {repo}")

    print(f"Set secret: {secret_name}")


def main() -> int:
    args = parse_args()
    auth0_dir = Path(args.auth0_dir).resolve()

    if not auth0_dir.is_dir():
        raise RuntimeError(f"Auth0 Terraform directory not found: {auth0_dir}")

    if not os.environ.get("GH_TOKEN"):
        raise RuntimeError(
            "GH_TOKEN is required. Provide a token that can update repository Actions secrets."
        )

    require_command("terraform")
    require_command("gh")

    raw_outputs = load_outputs(auth0_dir)
    values = validate_outputs(raw_outputs)

    for output_name, (secret_name, _) in OUTPUT_TO_SECRET.items():
        set_secret(args.repo, secret_name, values[output_name])

    print(f"Updated GitHub secrets for {args.repo} from Terraform outputs in {auth0_dir}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        raise SystemExit(1)

