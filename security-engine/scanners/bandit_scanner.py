"""
Bandit Scanner — Python static analysis for security vulnerabilities.
Uses bandit library to scan Python source code.
"""
import subprocess
import json
import os
from typing import List, Dict, Any
from pathlib import Path


SEVERITY_MAP = {
    "HIGH": "high",
    "MEDIUM": "medium",
    "LOW": "low",
}

CONFIDENCE_SEVERITY_BOOST = {
    "HIGH": 1,
    "MEDIUM": 0,
    "LOW": -1,
}

SEVERITY_FINAL = {
    "high+1": "critical",
    "high+0": "high",
    "high-1": "high",
    "medium+1": "high",
    "medium+0": "medium",
    "medium-1": "low",
    "low+1": "medium",
    "low+0": "low",
    "low-1": "info",
}


def run_bandit_scan(target_path: str) -> List[Dict[str, Any]]:
    """
    Run bandit on a directory or file and return normalized findings.

    Args:
        target_path: Path to Python file or directory to scan

    Returns:
        List of vulnerability dictionaries
    """
    if not os.path.exists(target_path):
        raise FileNotFoundError(f"Target path not found: {target_path}")

    cmd = [
        "bandit",
        "-r", target_path,
        "-f", "json",
        "--quiet",
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

    # Parse output even if bandit exits with non-zero (it does when findings exist)
    try:
        report = json.loads(result.stdout or "{}")
    except json.JSONDecodeError:
        return []

    findings = []
    for issue in report.get("results", []):
        sev = SEVERITY_MAP.get(issue.get("issue_severity", "LOW"), "low")
        conf_boost = CONFIDENCE_SEVERITY_BOOST.get(issue.get("issue_confidence", "MEDIUM"), 0)
        final_sev = SEVERITY_FINAL.get(f"{sev}+{conf_boost}", sev)

        findings.append({
            "title": issue.get("issue_text", "Unknown issue"),
            "description": f"Bandit: {issue.get('test_name', '')} — {issue.get('issue_text', '')}",
            "severity": final_sev,
            "scanner": "bandit",
            "file_path": issue.get("filename", ""),
            "line_number": issue.get("line_number"),
            "code_snippet": issue.get("code", ""),
            "cwe_id": issue.get("cwe", {}).get("id") if issue.get("cwe") else None,
            "fix_recommendation": issue.get("more_info", ""),
            "references": [issue.get("more_info", "")] if issue.get("more_info") else [],
            "raw": issue,
        })

    return findings


def get_bandit_stats(findings: List[Dict[str, Any]]) -> Dict[str, int]:
    """Return severity count summary."""
    stats = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    for f in findings:
        severity = f.get("severity", "info")
        stats[severity] = stats.get(severity, 0) + 1
    return stats
