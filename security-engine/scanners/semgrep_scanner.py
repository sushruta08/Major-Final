"""
Semgrep Scanner — multi-language static analysis using community rules.
Supports Python, JavaScript, TypeScript, Go, Java, and more.
"""
import subprocess
import json
import os
from typing import List, Dict, Any


SEVERITY_MAP = {
    "ERROR": "high",
    "WARNING": "medium",
    "INFO": "low",
}

# Maps Semgrep rule categories to OWASP Top 10 2021
RULE_OWASP_MAP = {
    "injection": "A03:2021",
    "sql": "A03:2021",
    "xss": "A03:2021",
    "auth": "A07:2021",
    "crypto": "A02:2021",
    "path-traversal": "A01:2021",
    "ssrf": "A10:2021",
    "secrets": "A02:2021",
    "xxe": "A05:2021",
    "deserializ": "A08:2021",
}

# Default rulesets to use
DEFAULT_RULESETS = [
    "p/python",
    "p/javascript",
    "p/security-audit",
    "p/owasp-top-ten",
]


def run_semgrep_scan(
    target_path: str,
    rulesets: List[str] = None,
) -> List[Dict[str, Any]]:
    """
    Run Semgrep on a target directory with security rule sets.

    Args:
        target_path: Path to source code directory
        rulesets: List of Semgrep ruleset identifiers

    Returns:
        List of normalized vulnerability findings
    """
    if not os.path.exists(target_path):
        raise FileNotFoundError(f"Target path not found: {target_path}")

    rulesets = rulesets or DEFAULT_RULESETS[:2]  # Use first 2 for speed

    config_args = []
    for ruleset in rulesets:
        config_args += ["--config", ruleset]

    cmd = [
        "semgrep",
        "--json",
        "--quiet",
        "--no-rewrite-rule-ids",
        *config_args,
        target_path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)

    try:
        report = json.loads(result.stdout or "{}")
    except json.JSONDecodeError:
        return []

    findings = []
    for result_item in report.get("results", []):
        check_id = result_item.get("check_id", "")
        extra = result_item.get("extra", {})
        metadata = extra.get("metadata", {})

        severity_raw = extra.get("severity", "WARNING").upper()
        severity = SEVERITY_MAP.get(severity_raw, "medium")

        # Upgrade severity if CVSS is available
        cvss = metadata.get("cvss")
        if cvss:
            if float(cvss) >= 9.0:
                severity = "critical"
            elif float(cvss) >= 7.0:
                severity = "high"

        # Map to OWASP category
        owasp_cat = None
        check_lower = check_id.lower()
        for keyword, cat in RULE_OWASP_MAP.items():
            if keyword in check_lower:
                owasp_cat = cat
                break

        location = result_item.get("start", {})
        findings.append({
            "title": metadata.get("message", extra.get("message", check_id)),
            "description": extra.get("message", ""),
            "severity": severity,
            "scanner": "semgrep",
            "file_path": result_item.get("path", ""),
            "line_number": location.get("line"),
            "code_snippet": extra.get("lines", ""),
            "cwe_id": (
                metadata.get("cwe", [None])[0] if isinstance(metadata.get("cwe"), list)
                else metadata.get("cwe")
            ),
            "owasp_category": owasp_cat,
            "cvss_score": float(cvss) if cvss else None,
            "fix_recommendation": metadata.get("fix-guidance", metadata.get("fix", "")),
            "references": metadata.get("references", []),
            "raw": {
                "check_id": check_id,
                "rule_url": f"https://semgrep.dev/r/{check_id}",
            },
        })

    return findings
