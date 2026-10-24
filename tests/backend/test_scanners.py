"""
Unit tests for security scanner modules.
Uses temporary files to simulate real scan targets.
"""
import pytest
import os
import tempfile
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../security-engine"))

from parsers.result_parser import (
    normalize_finding,
    normalize_findings,
    deduplicate_findings,
    aggregate_scan_results,
)


class TestResultParser:
    """Tests for the unified result parser/normalizer."""

    def test_normalize_finding_basic(self):
        raw = {
            "title": "SQL Injection",
            "description": "User input not sanitized",
            "severity": "critical",
            "scanner": "bandit",
            "file_path": "app/views.py",
            "line_number": 42,
        }
        normalized = normalize_finding(raw, "bandit")
        assert normalized["title"] == "SQL Injection"
        assert normalized["severity"] == "critical"
        assert normalized["scanner"] == "bandit"
        assert normalized["status"] == "open"
        assert "id" in normalized
        assert "created_at" in normalized

    def test_normalize_unknown_severity_defaults_to_info(self):
        raw = {"title": "Test", "severity": "SUPER_CRITICAL", "scanner": "test"}
        normalized = normalize_finding(raw, "test")
        assert normalized["severity"] == "info"

    def test_normalize_truncates_long_title(self):
        raw = {"title": "A" * 600, "severity": "low", "scanner": "test"}
        normalized = normalize_finding(raw, "test")
        assert len(normalized["title"]) <= 500

    def test_normalize_handles_missing_optional_fields(self):
        raw = {"title": "Minimal", "severity": "low", "scanner": "test"}
        normalized = normalize_finding(raw, "test")
        assert normalized["cve_id"] is None
        assert normalized["line_number"] is None
        assert normalized["references"] == []

    def test_normalize_safe_int(self):
        raw = {"title": "T", "severity": "low", "scanner": "t", "line_number": "not_a_number"}
        normalized = normalize_finding(raw, "t")
        assert normalized["line_number"] is None

    def test_normalize_safe_float(self):
        raw = {"title": "T", "severity": "low", "scanner": "t", "cvss_score": "bad"}
        normalized = normalize_finding(raw, "t")
        assert normalized["cvss_score"] is None

    def test_normalize_findings_list(self):
        raws = [
            {"title": "Issue 1", "severity": "high", "scanner": "bandit"},
            {"title": "Issue 2", "severity": "medium", "scanner": "bandit"},
        ]
        results = normalize_findings(raws, "bandit")
        assert len(results) == 2
        assert all(r["scanner"] == "bandit" for r in results)


class TestDeduplication:
    def test_removes_exact_duplicates(self):
        findings = [
            {"title": "SQL Injection", "file_path": "a.py", "line_number": 10, "severity": "high"},
            {"title": "SQL Injection", "file_path": "a.py", "line_number": 10, "severity": "high"},
        ]
        deduped = deduplicate_findings(findings)
        assert len(deduped) == 1

    def test_keeps_higher_severity_on_duplicate(self):
        findings = [
            {"title": "XSS", "file_path": "b.py", "line_number": 5, "severity": "medium"},
            {"title": "XSS", "file_path": "b.py", "line_number": 5, "severity": "critical"},
        ]
        deduped = deduplicate_findings(findings)
        assert len(deduped) == 1
        assert deduped[0]["severity"] == "critical"

    def test_keeps_different_locations(self):
        findings = [
            {"title": "XSS", "file_path": "a.py", "line_number": 10, "severity": "high"},
            {"title": "XSS", "file_path": "b.py", "line_number": 10, "severity": "high"},
        ]
        deduped = deduplicate_findings(findings)
        assert len(deduped) == 2

    def test_empty_list(self):
        assert deduplicate_findings([]) == []


class TestAggregation:
    def test_aggregate_counts_correctly(self):
        findings = [
            {"title": "A", "severity": "critical", "scanner": "bandit", "file_path": "a", "line_number": 1},
            {"title": "B", "severity": "high", "scanner": "semgrep", "file_path": "b", "line_number": 2},
            {"title": "C", "severity": "medium", "scanner": "bandit", "file_path": "c", "line_number": 3},
        ]
        agg = aggregate_scan_results(findings)
        assert agg["counts"]["critical"] == 1
        assert agg["counts"]["high"] == 1
        assert agg["counts"]["medium"] == 1
        assert agg["total"] == 3

    def test_aggregate_scanner_breakdown(self):
        findings = [
            {"title": "A", "severity": "high", "scanner": "bandit", "file_path": "x", "line_number": 1},
            {"title": "B", "severity": "high", "scanner": "bandit", "file_path": "y", "line_number": 2},
            {"title": "C", "severity": "high", "scanner": "trivy", "file_path": "z", "line_number": 3},
        ]
        agg = aggregate_scan_results(findings)
        assert agg["scanner_breakdown"]["bandit"] == 2
        assert agg["scanner_breakdown"]["trivy"] == 1

    def test_aggregate_empty(self):
        agg = aggregate_scan_results([])
        assert agg["total"] == 0
        assert agg["findings"] == []
