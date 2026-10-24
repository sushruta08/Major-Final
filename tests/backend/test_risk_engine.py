"""
Unit tests for the Risk Calculation Engine.
Tests score calculation, grading, and risk distribution.
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../security-engine"))

from risk_engine.risk_calculator import (
    calculate_security_score,
    get_security_grade,
    calculate_risk_level,
    get_risk_distribution,
    generate_security_report_summary,
)


class TestSecurityScoreCalculation:
    def test_perfect_score_no_findings(self):
        assert calculate_security_score([]) == 100.0

    def test_single_critical_deducts_25(self):
        findings = [{"severity": "critical"}]
        assert calculate_security_score(findings) == 75.0

    def test_critical_cap_at_60(self):
        # 3+ criticals should cap at 60 deduction
        findings = [{"severity": "critical"}] * 10
        score = calculate_security_score(findings)
        assert score == 40.0  # 100 - 60 (capped)

    def test_mixed_findings(self):
        findings = [
            {"severity": "critical"},
            {"severity": "high"},
            {"severity": "medium"},
            {"severity": "low"},
        ]
        score = calculate_security_score(findings)
        # 25 + 15 + 7 + 3 = 50 deduction
        assert score == 50.0

    def test_only_info_no_deduction(self):
        findings = [{"severity": "info"}] * 20
        assert calculate_security_score(findings) == 100.0

    def test_score_never_negative(self):
        findings = [{"severity": "critical"}] * 100
        assert calculate_security_score(findings) >= 0.0


class TestSecurityGrading:
    def test_a_plus_grade(self):
        assert get_security_grade(97.0) == "A+"
        assert get_security_grade(95.0) == "A+"

    def test_a_grade(self):
        assert get_security_grade(90.0) == "A"
        assert get_security_grade(85.0) == "A"

    def test_b_grade(self):
        assert get_security_grade(80.0) == "B"
        assert get_security_grade(75.0) == "B"

    def test_c_grade(self):
        assert get_security_grade(65.0) == "C"
        assert get_security_grade(60.0) == "C"

    def test_d_grade(self):
        assert get_security_grade(55.0) == "D"
        assert get_security_grade(50.0) == "D"

    def test_f_grade(self):
        assert get_security_grade(40.0) == "F"
        assert get_security_grade(0.0) == "F"

    def test_boundary_values(self):
        assert get_security_grade(94.9) == "A"
        assert get_security_grade(84.9) == "B"
        assert get_security_grade(74.9) == "C"


class TestRiskLevel:
    def test_critical_risk_with_critical_finding(self):
        findings = [{"severity": "critical"}]
        assert calculate_risk_level(findings) == "CRITICAL"

    def test_high_risk_with_3_high_findings(self):
        findings = [{"severity": "high"}] * 3
        assert calculate_risk_level(findings) == "HIGH"

    def test_medium_risk_with_one_high(self):
        findings = [{"severity": "high"}]
        assert calculate_risk_level(findings) == "MEDIUM"

    def test_low_risk_only_lows(self):
        findings = [{"severity": "low"}] * 5
        assert calculate_risk_level(findings) == "LOW"

    def test_empty_findings_low_risk(self):
        assert calculate_risk_level([]) == "LOW"


class TestRiskDistribution:
    def test_distribution_counts(self):
        findings = [
            {"severity": "critical"},
            {"severity": "critical"},
            {"severity": "high"},
            {"severity": "medium"},
        ]
        dist = get_risk_distribution(findings)
        dist_map = {d["name"]: d["value"] for d in dist}
        assert dist_map["Critical"] == 2
        assert dist_map["High"] == 1
        assert dist_map["Medium"] == 1

    def test_empty_distribution(self):
        assert get_risk_distribution([]) == []

    def test_distribution_has_colors(self):
        findings = [{"severity": "critical"}]
        dist = get_risk_distribution(findings)
        assert all("color" in d for d in dist)


class TestReportSummary:
    def test_summary_structure(self):
        findings = [
            {"severity": "critical"},
            {"severity": "high"},
            {"severity": "medium"},
        ]
        summary = generate_security_report_summary(findings)
        assert "score" in summary
        assert "grade" in summary
        assert "risk_level" in summary
        assert "total_findings" in summary
        assert "severity_counts" in summary
        assert "recommendation" in summary

    def test_summary_recommendation_critical(self):
        findings = [{"severity": "critical"}]
        summary = generate_security_report_summary(findings)
        assert "IMMEDIATE" in summary["recommendation"].upper()

    def test_summary_clean_recommendation(self):
        summary = generate_security_report_summary([])
        assert "updated" in summary["recommendation"].lower()
