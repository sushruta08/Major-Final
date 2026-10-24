"""
Risk Engine — calculates security scores and grades from scan findings.
"""
from typing import Dict, List, Any


# CVSS-based severity weights
SEVERITY_WEIGHTS = {
    "critical": 25,
    "high": 15,
    "medium": 7,
    "low": 3,
    "info": 0,
}

# Maximum deduction cap per severity bucket
SEVERITY_CAPS = {
    "critical": 60,
    "high": 40,
    "medium": 25,
    "low": 10,
}

GRADE_THRESHOLDS = [
    (95, "A+"),
    (85, "A"),
    (75, "B"),
    (60, "C"),
    (50, "D"),
    (0, "F"),
]


def calculate_security_score(findings: List[Dict[str, Any]]) -> float:
    """
    Calculate a 0-100 security score from vulnerability findings.
    Uses capped severity-weighted deductions.
    """
    # Count by severity
    counts: Dict[str, int] = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    for finding in findings:
        sev = finding.get("severity", "info")
        counts[sev] = counts.get(sev, 0) + 1

    # Calculate deductions, capped per severity
    total_deduction = 0.0
    for severity, count in counts.items():
        if severity not in SEVERITY_WEIGHTS:
            continue
        raw = count * SEVERITY_WEIGHTS[severity]
        cap = SEVERITY_CAPS.get(severity, 0)
        total_deduction += min(raw, cap)

    score = max(0.0, 100.0 - total_deduction)
    return round(score, 1)


def get_security_grade(score: float) -> str:
    """Convert a numeric score to a letter grade."""
    for threshold, grade in GRADE_THRESHOLDS:
        if score >= threshold:
            return grade
    return "F"


def calculate_risk_level(findings: List[Dict[str, Any]]) -> str:
    """Return a human-readable overall risk level."""
    counts: Dict[str, int] = {"critical": 0, "high": 0, "medium": 0}
    for f in findings:
        sev = f.get("severity", "")
        if sev in counts:
            counts[sev] += 1

    if counts["critical"] > 0:
        return "CRITICAL"
    if counts["high"] > 2:
        return "HIGH"
    if counts["high"] > 0 or counts["medium"] > 5:
        return "MEDIUM"
    return "LOW"


def get_risk_distribution(findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Return risk distribution data for pie charts."""
    colors = {
        "critical": "#ef4444",
        "high": "#f97316",
        "medium": "#eab308",
        "low": "#3b82f6",
        "info": "#64748b",
    }
    counts: Dict[str, int] = {}
    for f in findings:
        sev = f.get("severity", "info")
        counts[sev] = counts.get(sev, 0) + 1

    return [
        {"name": sev.capitalize(), "value": count, "color": colors.get(sev, "#64748b")}
        for sev, count in counts.items()
        if count > 0
    ]


def generate_security_report_summary(findings: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate a complete security assessment summary."""
    score = calculate_security_score(findings)
    grade = get_security_grade(score)
    risk_level = calculate_risk_level(findings)
    distribution = get_risk_distribution(findings)

    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    for f in findings:
        sev = f.get("severity", "info")
        counts[sev] = counts.get(sev, 0) + 1

    return {
        "score": score,
        "grade": grade,
        "risk_level": risk_level,
        "total_findings": len(findings),
        "severity_counts": counts,
        "distribution": distribution,
        "recommendation": (
            "IMMEDIATE ACTION REQUIRED: Critical vulnerabilities found." if counts["critical"] > 0 else
            "Address high severity issues within 24 hours." if counts["high"] > 0 else
            "Schedule remediation for medium issues within 7 days." if counts["medium"] > 0 else
            "Good security posture. Keep dependencies updated."
        ),
    }
