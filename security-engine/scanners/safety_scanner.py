"""
Safety Scanner — Python dependency vulnerability checker.
Uses the `safety` package to check requirements files against CVE databases.
"""
import subprocess
import json
import os
from typing import List, Dict, Any


def run_safety_scan(requirements_file: str) -> List[Dict[str, Any]]:
    """
    Run safety check on a requirements.txt file.

    Args:
        requirements_file: Path to requirements.txt

    Returns:
        List of vulnerability dictionaries
    """
    if not os.path.exists(requirements_file):
        raise FileNotFoundError(f"Requirements file not found: {requirements_file}")

    cmd = [
        "safety", "check",
        "--file", requirements_file,
        "--json",
        "--full-report",
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

    try:
        # Safety outputs a list of vulnerabilities
        report = json.loads(result.stdout or "[]")
    except json.JSONDecodeError:
        return []

    findings = []

    # Handle both old and new safety JSON formats
    vulns = []
    if isinstance(report, list):
        vulns = report
    elif isinstance(report, dict):
        vulns = report.get("vulnerabilities", [])

    for vuln in vulns:
        # Safety format: [package, affected_versions, installed_version, advisory, vuln_id]
        if isinstance(vuln, list) and len(vuln) >= 5:
            pkg_name, affected, installed, advisory, vuln_id = vuln[:5]
            findings.append({
                "title": f"{pkg_name} {installed} has known vulnerabilities",
                "description": advisory,
                "severity": _estimate_severity(advisory),
                "scanner": "safety",
                "cve_id": vuln_id if vuln_id.startswith("CVE-") else None,
                "fix_recommendation": (
                    f"Upgrade {pkg_name} from {installed}. "
                    f"Affected versions: {affected}. "
                    "Check PyPI for the latest patched version."
                ),
                "references": [
                    f"https://pypi.org/project/{pkg_name}/",
                    f"https://data.safetycli.com/v/{vuln_id}",
                ],
                "raw": {"package": pkg_name, "installed": installed, "advisory": advisory},
            })
        elif isinstance(vuln, dict):
            pkg = vuln.get("package_name", vuln.get("name", "unknown"))
            findings.append({
                "title": f"{pkg} — {vuln.get('vulnerability_id', '')}",
                "description": vuln.get("advisory", vuln.get("description", "")),
                "severity": _estimate_severity(vuln.get("advisory", "")),
                "scanner": "safety",
                "cve_id": vuln.get("cve", vuln.get("vulnerability_id")),
                "fix_recommendation": f"Upgrade {pkg} to a non-vulnerable version.",
                "references": [],
                "raw": vuln,
            })

    return findings


def _estimate_severity(advisory: str) -> str:
    """Heuristically estimate severity from advisory text."""
    text = advisory.lower()
    if any(w in text for w in ["remote code execution", "arbitrary code", "rce", "critical"]):
        return "critical"
    if any(w in text for w in ["sql injection", "xss", "xxe", "privilege escalation", "authentication bypass"]):
        return "high"
    if any(w in text for w in ["denial of service", "dos", "information disclosure", "moderate"]):
        return "medium"
    return "low"
