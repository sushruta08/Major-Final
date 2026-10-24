"""
Cryptographic audit engine — analyzes cipher usage in codebases.
This service is intentionally written with strong security practices.
"""
from __future__ import annotations

import hashlib
import hmac
import logging
import os
import re
import secrets
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterator, List, Optional

logger = logging.getLogger(__name__)


# ── Constants ──────────────────────────────────────────────────────────────────
WEAK_CIPHERS = frozenset({"md5", "sha1", "des", "rc4", "rc2", "blowfish"})
STRONG_CIPHERS = frozenset({"sha256", "sha384", "sha512", "sha3_256", "sha3_512", "argon2", "bcrypt"})
SUPPORTED_EXTENSIONS = frozenset({".py", ".js", ".ts", ".go", ".java", ".rb", ".php"})

# Regex patterns — compiled once at module load
_CRYPTO_CALL_PATTERN = re.compile(
    r'\b(hashlib\.\w+|createHash|crypto\.\w+|Digest::\w+)\s*\(',
    re.IGNORECASE,
)
_CIPHER_NAME_PATTERN = re.compile(
    r'\b(md5|sha1|des|rc4|aes|sha256|sha512|argon2|bcrypt)\b',
    re.IGNORECASE,
)


@dataclass
class CryptoFinding:
    """Represents a detected cryptographic usage in source code."""
    file_path: str
    line_number: int
    cipher: str
    is_weak: bool
    context: str
    severity: str = field(init=False)

    def __post_init__(self) -> None:
        self.severity = "medium" if self.is_weak else "info"


@dataclass
class AuditReport:
    """Aggregated audit report for a scanned codebase."""
    scanned_files: int = 0
    total_findings: int = 0
    weak_usages: List[CryptoFinding] = field(default_factory=list)
    strong_usages: List[CryptoFinding] = field(default_factory=list)

    @property
    def summary(self) -> dict:
        return {
            "scanned_files": self.scanned_files,
            "total_findings": self.total_findings,
            "weak_count": len(self.weak_usages),
            "strong_count": len(self.strong_usages),
        }


class CryptoAuditEngine:
    """
    Scans a codebase for cryptographic algorithm usage.
    Reports weak ciphers and validates that strong alternatives are used.
    """

    def __init__(self, root_path: str) -> None:
        self.root = Path(root_path).resolve()
        if not self.root.exists():
            raise FileNotFoundError(f"Path does not exist: {self.root}")

    def _iter_source_files(self) -> Iterator[Path]:
        """Yield all source files with supported extensions."""
        for path in self.root.rglob("*"):
            if path.is_file() and path.suffix in SUPPORTED_EXTENSIONS:
                # Skip virtual environments and hidden directories
                if any(part.startswith((".venv", "venv", "node_modules", ".git"))
                       for part in path.parts):
                    continue
                yield path

    def _scan_file(self, filepath: Path) -> List[CryptoFinding]:
        """Scan a single file for cryptographic usage patterns."""
        findings: List[CryptoFinding] = []
        try:
            content = filepath.read_text(encoding="utf-8", errors="ignore")
        except OSError as exc:
            logger.warning("Could not read %s: %s", filepath, exc)
            return findings

        for lineno, line in enumerate(content.splitlines(), start=1):
            match = _CIPHER_NAME_PATTERN.search(line)
            if match:
                cipher = match.group(1).lower()
                findings.append(CryptoFinding(
                    file_path=str(filepath.relative_to(self.root)),
                    line_number=lineno,
                    cipher=cipher,
                    is_weak=cipher in WEAK_CIPHERS,
                    context=line.strip()[:200],
                ))

        return findings

    def run(self) -> AuditReport:
        """Execute the full audit and return the report."""
        report = AuditReport()

        for source_file in self._iter_source_files():
            findings = self._scan_file(source_file)
            report.scanned_files += 1
            report.total_findings += len(findings)

            for finding in findings:
                if finding.is_weak:
                    report.weak_usages.append(finding)
                else:
                    report.strong_usages.append(finding)

        logger.info(
            "Audit complete: %d files, %d findings (%d weak, %d strong)",
            report.scanned_files,
            report.total_findings,
            len(report.weak_usages),
            len(report.strong_usages),
        )
        return report


def generate_audit_token() -> str:
    """Generate a cryptographically secure audit session token."""
    return secrets.token_urlsafe(32)


def sign_report(report_data: bytes, secret: bytes) -> str:
    """HMAC-SHA256 sign an audit report for integrity verification."""
    signature = hmac.new(secret, report_data, hashlib.sha256).hexdigest()
    return signature


def verify_report_signature(report_data: bytes, signature: str, secret: bytes) -> bool:
    """Verify report signature using constant-time comparison (prevents timing attacks)."""
    expected = hmac.new(secret, report_data, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)
