"""
Pipeline Runner — orchestrates all security scanners in a CI/CD pipeline.
Each stage runs in sequence with result aggregation.
"""
import os
import time
import logging
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime

from scanners.bandit_scanner import run_bandit_scan
from scanners.gitleaks_scanner import run_gitleaks_scan
from scanners.safety_scanner import run_safety_scan
from scanners.semgrep_scanner import run_semgrep_scan
from parsers.result_parser import normalize_findings, aggregate_scan_results
from risk_engine.risk_calculator import generate_security_report_summary

logger = logging.getLogger(__name__)


class PipelineStage:
    """Represents a single stage in the security pipeline."""

    def __init__(self, name: str, scanner_fn: Callable, enabled: bool = True):
        self.name = name
        self.scanner_fn = scanner_fn
        self.enabled = enabled
        self.status = "pending"
        self.started_at: Optional[str] = None
        self.completed_at: Optional[str] = None
        self.duration: Optional[float] = None
        self.findings: List[Dict[str, Any]] = []
        self.error: Optional[str] = None

    def run(self, *args, **kwargs) -> List[Dict[str, Any]]:
        if not self.enabled:
            self.status = "skipped"
            return []

        self.status = "running"
        self.started_at = datetime.utcnow().isoformat()
        start = time.time()

        try:
            raw = self.scanner_fn(*args, **kwargs)
            self.findings = normalize_findings(raw, self.name)
            self.status = "completed"
        except FileNotFoundError as e:
            logger.warning(f"Stage {self.name} skipped: {e}")
            self.status = "skipped"
            self.error = str(e)
        except Exception as e:
            logger.error(f"Stage {self.name} failed: {e}")
            self.status = "failed"
            self.error = str(e)
        finally:
            self.duration = round(time.time() - start, 2)
            self.completed_at = datetime.utcnow().isoformat()

        return self.findings

    def to_dict(self) -> Dict[str, Any]:
        return {
            "stage": self.name,
            "status": self.status,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "duration": self.duration,
            "findings": len(self.findings),
            "error": self.error,
        }


class SecurityPipeline:
    """
    Orchestrates the full security scanning pipeline.

    Stages:
      1. Static Code Analysis (Bandit / Semgrep)
      2. Secrets Detection (Gitleaks)
      3. Dependency Scan (Safety)
      4. Container Scan (Trivy — optional)
    """

    def __init__(self, repo_path: str, config: Optional[Dict[str, Any]] = None):
        self.repo_path = repo_path
        self.config = config or {}
        self.pipeline_id = f"pl_{int(time.time())}"
        self.started_at = datetime.utcnow().isoformat()
        self.completed_at: Optional[str] = None
        self.all_findings: List[Dict[str, Any]] = []
        self.stages: List[PipelineStage] = []

    def _find_requirements(self) -> Optional[str]:
        """Find requirements.txt in the repo."""
        for name in ["requirements.txt", "requirements/base.txt", "requirements/prod.txt"]:
            path = os.path.join(self.repo_path, name)
            if os.path.exists(path):
                return path
        return None

    def run(self) -> Dict[str, Any]:
        """Execute the full pipeline and return the aggregated report."""
        logger.info(f"Starting pipeline {self.pipeline_id} on {self.repo_path}")

        req_file = self._find_requirements()

        # Define pipeline stages
        stages = [
            PipelineStage("bandit", lambda: run_bandit_scan(self.repo_path), enabled=True),
            PipelineStage("semgrep", lambda: run_semgrep_scan(self.repo_path), enabled=self.config.get("semgrep", True)),
            PipelineStage("gitleaks", lambda: run_gitleaks_scan(self.repo_path), enabled=True),
            PipelineStage(
                "safety",
                lambda: run_safety_scan(req_file) if req_file else [],
                enabled=bool(req_file),
            ),
        ]

        self.stages = stages
        for stage in stages:
            findings = stage.run()
            self.all_findings.extend(findings)
            logger.info(
                f"Stage {stage.name}: {stage.status} — "
                f"{len(stage.findings)} findings in {stage.duration}s"
            )

        self.completed_at = datetime.utcnow().isoformat()

        # Aggregate and summarize
        aggregated = aggregate_scan_results(self.all_findings)
        summary = generate_security_report_summary(aggregated["findings"])

        return {
            "pipeline_id": self.pipeline_id,
            "repo_path": self.repo_path,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "stages": [s.to_dict() for s in self.stages],
            "summary": summary,
            "findings": aggregated["findings"],
            "scanner_breakdown": aggregated["scanner_breakdown"],
        }


def run_pipeline(repo_path: str, config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Entry point for running the full security pipeline."""
    pipeline = SecurityPipeline(repo_path, config)
    return pipeline.run()


if __name__ == "__main__":
    import sys
    import json

    if len(sys.argv) < 2:
        print("Usage: python pipeline_runner.py <repo_path>")
        sys.exit(1)

    result = run_pipeline(sys.argv[1])
    print(json.dumps(result, indent=2))
