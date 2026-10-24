"""
Report Service — generates security assessment reports in PDF/CSV/JSON.
"""
import json
import csv
import io
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class ReportService:
    """Generates security reports in various formats."""

    def generate_json_report(
        self,
        findings: List[Dict[str, Any]],
        metadata: Dict[str, Any],
        report_type: str = "developer",
    ) -> str:
        """Generate a structured JSON security report."""
        report = {
            "report_type": report_type,
            "generated_at": datetime.utcnow().isoformat(),
            "generator": "SecureCI v1.0.0",
            "metadata": metadata,
            "summary": self._build_summary(findings),
            "findings": findings,
        }
        return json.dumps(report, indent=2, default=str)

    def generate_csv_report(
        self,
        findings: List[Dict[str, Any]],
    ) -> str:
        """Generate a flat CSV report for spreadsheet analysis."""
        output = io.StringIO()
        fieldnames = [
            "id", "title", "severity", "scanner", "file_path",
            "line_number", "cve_id", "cwe_id", "owasp_category",
            "cvss_score", "status", "fix_recommendation", "created_at",
        ]
        writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for finding in findings:
            writer.writerow({k: finding.get(k, "") for k in fieldnames})
        return output.getvalue()

    def generate_executive_summary(
        self,
        findings: List[Dict[str, Any]],
        metadata: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Generate an executive-level security summary.
        Suitable for non-technical stakeholders.
        """
        summary = self._build_summary(findings)
        score = summary["security_score"]

        return {
            "title": "Executive Security Assessment",
            "date": datetime.utcnow().strftime("%B %d, %Y"),
            "organization": metadata.get("organization", ""),
            "project": metadata.get("project", ""),
            "executive_summary": self._executive_narrative(score, summary),
            "security_score": score,
            "security_grade": summary["grade"],
            "risk_level": summary["risk_level"],
            "key_findings": [
                f for f in findings
                if f.get("severity") in ["critical", "high"]
            ][:10],
            "recommendations": self._get_recommendations(findings),
            "compliance_status": self._compliance_overview(findings),
            "metrics": summary,
        }

    def generate_owasp_report(
        self,
        findings: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Map findings to OWASP Top 10 categories."""
        owasp_map: Dict[str, List] = {}
        unmapped = []

        for finding in findings:
            cat = finding.get("owasp_category")
            if cat:
                if cat not in owasp_map:
                    owasp_map[cat] = []
                owasp_map[cat].append(finding)
            else:
                unmapped.append(finding)

        return {
            "standard": "OWASP Top 10 2021",
            "generated_at": datetime.utcnow().isoformat(),
            "categories": {
                cat: {
                    "total": len(items),
                    "critical": sum(1 for i in items if i.get("severity") == "critical"),
                    "high": sum(1 for i in items if i.get("severity") == "high"),
                    "findings": items,
                }
                for cat, items in owasp_map.items()
            },
            "unmapped_findings": len(unmapped),
            "total_mapped": len(findings) - len(unmapped),
        }

    # ── Private helpers ──────────────────────────────────────

    def _build_summary(self, findings: List[Dict[str, Any]]) -> Dict[str, Any]:
        counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
        for f in findings:
            sev = f.get("severity", "info")
            counts[sev] = counts.get(sev, 0) + 1

        total_deduction = (
            min(counts["critical"] * 25, 60) +
            min(counts["high"] * 15, 40) +
            min(counts["medium"] * 7, 25) +
            min(counts["low"] * 3, 10)
        )
        score = max(0.0, 100.0 - total_deduction)
        grade = (
            "A+" if score >= 95 else "A" if score >= 85 else
            "B" if score >= 75 else "C" if score >= 60 else
            "D" if score >= 50 else "F"
        )
        risk = (
            "CRITICAL" if counts["critical"] > 0 else
            "HIGH" if counts["high"] > 2 else
            "MEDIUM" if counts["high"] > 0 or counts["medium"] > 5 else
            "LOW"
        )

        return {
            "total_findings": len(findings),
            "severity_counts": counts,
            "security_score": round(score, 1),
            "grade": grade,
            "risk_level": risk,
        }

    def _executive_narrative(self, score: float, summary: Dict) -> str:
        if score >= 85:
            return (
                f"The security assessment indicates a strong security posture with a score of {score}/100 "
                f"(Grade: {summary['grade']}). The application demonstrates good security practices "
                f"with {summary['severity_counts']['critical']} critical and "
                f"{summary['severity_counts']['high']} high severity issues requiring attention."
            )
        elif score >= 60:
            return (
                f"The assessment reveals moderate security risks with a score of {score}/100 "
                f"(Grade: {summary['grade']}). There are {summary['severity_counts']['critical']} "
                f"critical vulnerabilities requiring immediate remediation and "
                f"{summary['severity_counts']['high']} high severity issues."
            )
        else:
            return (
                f"⚠️ CRITICAL SECURITY RISK: The assessment reveals significant vulnerabilities "
                f"with a score of {score}/100 (Grade: {summary['grade']}). "
                f"Immediate action is required to address {summary['severity_counts']['critical']} "
                f"critical vulnerabilities before deployment."
            )

    def _get_recommendations(self, findings: List[Dict[str, Any]]) -> List[str]:
        recs = set()
        for f in findings:
            if f.get("fix_recommendation"):
                recs.add(f["fix_recommendation"])
        return list(recs)[:10]

    def _compliance_overview(self, findings: List[Dict[str, Any]]) -> Dict[str, str]:
        owasp_violated = set(
            f.get("owasp_category") for f in findings
            if f.get("owasp_category") and f.get("severity") in ["critical", "high"]
        )
        all_owasp = {f"A{i:02d}:2021" for i in range(1, 11)}
        passed = all_owasp - owasp_violated
        return {
            "owasp_top10": f"{len(passed)}/10 categories passing",
            "violated_categories": list(owasp_violated),
        }
