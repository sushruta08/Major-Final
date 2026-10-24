"""
Gitleaks Scanner — detect hardcoded secrets and API keys in git repos.
Wraps the gitleaks CLI tool and normalizes output.
"""
import subprocess
import json
import os
from typing import List, Dict, Any


RULE_SEVERITY_MAP = {
    "aws-access-token": "critical",
    "aws-secret-key": "critical",
    "github-pat": "critical",
    "gitlab-pat": "critical",
    "private-key": "critical",
    "stripe-access-token": "critical",
    "slack-access-token": "high",
    "generic-api-key": "high",
    "generic-secret": "high",
    "password": "medium",
    "jwt": "medium",
    "default": "high",
}


def run_gitleaks_scan(repo_path: str) -> List[Dict[str, Any]]:
    """
    Run gitleaks on a git repository and return normalized findings.

    Args:
        repo_path: Local path to git repository

    Returns:
        List of secret finding dictionaries
    """
    if not os.path.exists(repo_path):
        raise FileNotFoundError(f"Repository path not found: {repo_path}")

    report_file = "/tmp/gitleaks_report.json"
    cmd = [
        "gitleaks",
        "detect",
        "--source", repo_path,
        "--report-format", "json",
        "--report-path", report_file,
        "--exit-code", "0",  # Don't fail on findings
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

    if not os.path.exists(report_file):
        return []

    try:
        with open(report_file) as f:
            report = json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return []

    findings = []
    for issue in (report or []):
        rule_id = issue.get("RuleID", "default").lower()
        severity = RULE_SEVERITY_MAP.get(rule_id, RULE_SEVERITY_MAP["default"])

        findings.append({
            "title": f"Secret detected: {issue.get('Description', 'Unknown secret')}",
            "description": (
                f"Gitleaks found a potential secret ({issue.get('RuleID')}) "
                f"in file {issue.get('File')}. "
                f"Commit: {issue.get('Commit', 'unknown')}"
            ),
            "severity": severity,
            "scanner": "gitleaks",
            "file_path": issue.get("File", ""),
            "line_number": issue.get("StartLine"),
            "code_snippet": issue.get("Match", ""),
            "owasp_category": "A02:2021",  # Cryptographic Failures / Secrets
            "fix_recommendation": (
                "Remove the secret from the repository immediately. "
                "Rotate the exposed credential. "
                "Use environment variables or a secrets manager (AWS Secrets Manager, Vault)."
            ),
            "references": ["https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html"],
            "raw": issue,
        })

    return findings
