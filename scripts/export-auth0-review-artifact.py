#!/usr/bin/env python3
import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

ALLOWED_OUTPUTS = {
    "auth0_domain": "AUTH0_DOMAIN",
    "auth0_audience": "AUTH0_AUDIENCE",
    "auth0_client_id": "AUTH0_CLIENT_ID",
    "web_auth0_domain": "WEB_AUTH0_DOMAIN",
    "web_auth0_client_id": "WEB_AUTH0_CLIENT_ID",
    "web_auth0_audience": "WEB_AUTH0_AUDIENCE",
    "admin_auth0_domain": "ADMIN_AUTH0_DOMAIN",
    "admin_auth0_client_id": "ADMIN_AUTH0_CLIENT_ID",
    "admin_auth0_audience": "ADMIN_AUTH0_AUDIENCE",
    "database_connection_name": "DATABASE_CONNECTION_NAME",
    "google_connection_name": "GOOGLE_CONNECTION_NAME",
    "platform_admin_role_id": "PLATFORM_ADMIN_ROLE_ID",
    "support_role_id": "SUPPORT_ROLE_ID",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export a sanitized Auth0 Terraform output bundle for review artifacts."
    )
    parser.add_argument(
        "--auth0-dir",
        default=str(Path(__file__).resolve().parents[1] / "infra" / "auth0"),
        help="Path to the Auth0 Terraform stack",
    )
    parser.add_argument(
        "--output-dir",
        required=True,
        help="Directory where the sanitized review artifact files should be written",
    )
    return parser.parse_args()


def quote_env_value(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


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


def build_sanitized_outputs(raw_outputs: dict) -> dict[str, str]:
    missing = [name for name in ALLOWED_OUTPUTS if name not in raw_outputs or "value" not in raw_outputs[name]]
    if missing:
        raise RuntimeError(
            "Missing required non-sensitive Auth0 outputs: " + ", ".join(missing)
        )

    sanitized: dict[str, str] = {}
    for output_name in ALLOWED_OUTPUTS:
        metadata = raw_outputs[output_name]
        if metadata.get("sensitive"):
            raise RuntimeError(
                f"Output {output_name} is marked sensitive and cannot be included in the review artifact."
            )

        value = metadata.get("value")
        sanitized[output_name] = "" if value is None else str(value)

    return sanitized


def write_artifact(output_dir: Path, sanitized_outputs: dict[str, str]) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    json_path = output_dir / "auth0-outputs.json"
    env_path = output_dir / "auth0-outputs.env"
    md_path = output_dir / "README.md"

    json_path.write_text(json.dumps(sanitized_outputs, indent=2, sort_keys=True) + "\n")

    env_lines = [
        f"{ALLOWED_OUTPUTS[output_name]}={quote_env_value(value)}"
        for output_name, value in sanitized_outputs.items()
    ]
    env_path.write_text("\n".join(env_lines) + "\n")

    markdown_lines = [
        "# Auth0 review artifact",
        "",
        "This bundle contains non-sensitive Terraform outputs from `infra/auth0`.",
        "It is intended for reviewer visibility after an Auth0 apply.",
        "",
        "## Included outputs",
        "",
    ]

    for output_name, value in sanitized_outputs.items():
        markdown_lines.append(f"- `{output_name}` = `{value}`")

    markdown_lines.extend(
        [
            "",
            "## Files",
            "",
            "- `auth0-outputs.json` — machine-readable output values",
            "- `auth0-outputs.env` — env-style mapping for safe values only",
            "",
            "Sensitive outputs such as `auth0_client_secret` are intentionally excluded.",
        ]
    )

    md_path.write_text("\n".join(markdown_lines) + "\n")


def main() -> int:
    args = parse_args()
    auth0_dir = Path(args.auth0_dir).resolve()
    output_dir = Path(args.output_dir).resolve()

    if not auth0_dir.is_dir():
        raise RuntimeError(f"Auth0 Terraform directory not found: {auth0_dir}")

    raw_outputs = load_outputs(auth0_dir)
    sanitized_outputs = build_sanitized_outputs(raw_outputs)
    write_artifact(output_dir, sanitized_outputs)

    print(f"Wrote sanitized Auth0 review artifact to {output_dir}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        raise SystemExit(1)

