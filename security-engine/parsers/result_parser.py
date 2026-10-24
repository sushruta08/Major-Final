"""
Result Parser — normalizes output from all scanners into a unified format.
All scanners output to this common schema before storage.
"""
from typing import List, Dict, Any
from datetime import datetime
import uuid


VALID_SEVERITIES = {"critical", "high", "medium", "low", "info"}
VALID_STATUSES = {"open", "fixed", "accepted", "false_positive"}


def normalize_finding(raw: Dict[str, Any], scanner: str) -> Dict[str, Any]:
    """
    Normalize a raw scanner finding to the SecureCI vulnerability schema.

    Args:
        raw: Raw finding from any scanner
        scanner: Scanner identifier (bandit, semgrep, trivy, etc.)

    Returns:
        Normalized vulnerability dictionary
    """
    severity = raw.get("severity", "info").lower()
    if severity not in VALID_SEVERITIES:
        severity = "info"

    return {
        "id": str(uuid.uuid4()),
        "title": _truncate(raw.get("title", "Unknown vulnerability"), 500),
        "description": _truncate(raw.get("description", ""), 2000),
        "severity": severity,
        "scanner": scanner,
        "file_path": raw.get("file_path"),
        "line_number": _safe_int(raw.get("line_number")),
        "code_snippet": _truncate(raw.get("code_snippet", ""), 1000),
        "cve_id": raw.get("cve_id"),
        "cwe_id": raw.get("cwe_id"),
        "owasp_category": raw.get("owasp_category"),
        "cvss_score": _safe_float(raw.get("cvss_score")),
        "fix_recommendation": _truncate(raw.get("fix_recommendation", ""), 2000),
        "references": raw.get("references", []) if isinstance(raw.get("references"), list) else [],
        "status": "open",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }


def normalize_findings(
    raw_findings: List[Dict[str, Any]],
    scanner: str,
) -> List[Dict[str, Any]]:
    """Normalize a list of raw findings from a single scanner."""
    return [normalize_finding(f, scanner) for f in raw_findings]


def deduplicate_findings(findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Remove duplicate findings based on title + file_path + line_number.
    Keeps the highest severity duplicate.
    """
    severity_order = {"critical": 5, "high": 4, "medium": 3, "low": 2, "info": 1}
    seen: Dict[str, Dict[str, Any]] = {}

    for finding in findings:
        key = f"{finding['title']}|{finding.get('file_path', '')}|{finding.get('line_number', '')}"
        if key not in seen:
            seen[key] = finding
        else:
            existing_order = severity_order.get(seen[key]["severity"], 0)
            new_order = severity_order.get(finding["severity"], 0)
            if new_order > existing_order:
                seen[key] = finding

    return list(seen.values())


def aggregate_scan_results(all_findings: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Aggregate findings from multiple scanners into summary statistics.
    """
    deduped = deduplicate_findings(all_findings)

    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    for f in deduped:
        sev = f.get("severity", "info")
        counts[sev] = counts.get(sev, 0) + 1

    scanner_breakdown: Dict[str, int] = {}
    for f in deduped:
        s = f.get("scanner", "unknown")
        scanner_breakdown[s] = scanner_breakdown.get(s, 0) + 1

    return {
        "total": len(deduped),
        "counts": counts,
        "scanner_breakdown": scanner_breakdown,
        "findings": deduped,
    }


def _truncate(value: Any, max_len: int) -> str:
    if not isinstance(value, str):
        value = str(value) if value else ""
    return value[:max_len]


def _safe_int(value: Any) -> Any:
    try:
        return int(value) if value is not None else None
    except (ValueError, TypeError):
        return None


def _safe_float(value: Any) -> Any:
    try:
        return float(value) if value is not None else None
    except (ValueError, TypeError):
        return None
