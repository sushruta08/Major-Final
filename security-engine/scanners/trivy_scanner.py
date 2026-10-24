"""
Trivy Scanner — container image and filesystem vulnerability scanning.
Wraps Trivy CLI and normalizes findings to the SecureCI schema.
"""
import subprocess
import json
import os
from typing import List, Dict, Any


SEVERITY_MAP = {
    "CRITICAL": "critical",
    "HIGH": "high",
    "MEDIUM": "medium",
    "LOW": "low",
    "UNKNOWN": "info",
}


def run_trivy_image_scan(image: str) -> List[Dict[str, Any]]:
    """
    Run Trivy against a Docker image and return normalized findings.

    Args:
        image: Docker image tag (e.g. 'python:3.9-slim')

    Returns:
        List of vulnerability dictionaries
    """
    cmd = [
        "trivy", "image",
        "--format", "json",
        "--quiet",
        "--no-progress",
        image,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)

    try:
        report = json.loads(result.stdout or "{}")
    except json.JSONDecodeError:
        return []

    findings = []
    for target in report.get("Results", []):
        for vuln in target.get("Vulnerabilities") or []:
            severity = SEVERITY_MAP.get(vuln.get("Severity", "UNKNOWN"), "info")
            findings.append({
                "title": f"{vuln.get('VulnerabilityID')}: {vuln.get('Title', 'No title')}",
                "description": vuln.get("Description", ""),
                "severity": severity,
                "scanner": "trivy",
                "file_path": target.get("Target", ""),
                "cve_id": vuln.get("VulnerabilityID"),
                "cvss_score": (
                    vuln.get("CVSS", {}).get("nvd", {}).get("V3Score")
                    or vuln.get("CVSS", {}).get("nvd", {}).get("V2Score")
                ),
                "fix_recommendation": (
                    f"Upgrade {vuln.get('PkgName')} from "
                    f"{vuln.get('InstalledVersion')} to "
                    f"{vuln.get('FixedVersion', 'latest')}"
                    if vuln.get("FixedVersion") else
                    f"No fix available for {vuln.get('PkgName')} {vuln.get('InstalledVersion')}"
                ),
                "references": vuln.get("References", []),
                "raw": {
                    "pkg_name": vuln.get("PkgName"),
                    "installed_version": vuln.get("InstalledVersion"),
                    "fixed_version": vuln.get("FixedVersion"),
                },
            })

    return findings


def run_trivy_fs_scan(path: str) -> List[Dict[str, Any]]:
    """
    Run Trivy filesystem scan for dependency vulnerabilities.

    Args:
        path: Local path to scan

    Returns:
        List of vulnerability dictionaries
    """
    if not os.path.exists(path):
        raise FileNotFoundError(f"Path not found: {path}")

    cmd = [
        "trivy", "fs",
        "--format", "json",
        "--quiet",
        path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)

    try:
        report = json.loads(result.stdout or "{}")
    except json.JSONDecodeError:
        return []

    findings = []
    for target in report.get("Results", []):
        for vuln in target.get("Vulnerabilities") or []:
            severity = SEVERITY_MAP.get(vuln.get("Severity", "UNKNOWN"), "info")
            findings.append({
                "title": f"{vuln.get('VulnerabilityID')}: {vuln.get('Title', '')}",
                "description": vuln.get("Description", ""),
                "severity": severity,
                "scanner": "trivy",
                "file_path": target.get("Target", ""),
                "cve_id": vuln.get("VulnerabilityID"),
                "fix_recommendation": (
                    f"Upgrade {vuln.get('PkgName')} to {vuln.get('FixedVersion', 'latest')}"
                ),
                "references": vuln.get("References", []),
                "raw": vuln,
            })

    return findings
