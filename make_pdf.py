"""
SecureCI Project Analysis — PDF Generator
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from datetime import datetime

W, H = A4
OUT = r"c:\Users\akkat\Downloads\Final Major\SecureCI_Analysis.pdf"

# ── Colours ────────────────────────────────────────────────
C = {
    "bg":      colors.HexColor("#0f172a"),
    "accent":  colors.HexColor("#6366f1"),
    "accent2": colors.HexColor("#818cf8"),
    "crit":    colors.HexColor("#ef4444"),
    "high":    colors.HexColor("#f97316"),
    "med":     colors.HexColor("#eab308"),
    "low":     colors.HexColor("#3b82f6"),
    "ok":      colors.HexColor("#22c55e"),
    "white":   colors.white,
    "lgray":   colors.HexColor("#f8fafc"),
    "mgray":   colors.HexColor("#94a3b8"),
    "dgray":   colors.HexColor("#1e293b"),
    "text":    colors.HexColor("#0f172a"),
    "border":  colors.HexColor("#e2e8f0"),
    "eef":     colors.HexColor("#eef2ff"),
}

# ── Styles ─────────────────────────────────────────────────
def S(name, **kw):
    defaults = dict(fontName="Helvetica", fontSize=9.5,
                    textColor=C["text"], leading=14, spaceAfter=2)
    defaults.update(kw)
    return ParagraphStyle(name, **defaults)

ST = {
    "cover_h1":  S("ch1", fontSize=34, fontName="Helvetica-Bold",
                   textColor=C["white"], alignment=TA_CENTER, leading=42),
    "cover_sub": S("csub", fontSize=13, textColor=C["accent2"],
                   alignment=TA_CENTER, leading=18),
    "cover_inf": S("cinf", fontSize=9, textColor=C["text"], leading=13),
    "h1":        S("h1", fontSize=17, fontName="Helvetica-Bold",
                   textColor=C["accent"], spaceBefore=16, spaceAfter=6, leading=21),
    "h2":        S("h2", fontSize=12, fontName="Helvetica-Bold",
                   textColor=C["bg"], spaceBefore=12, spaceAfter=5, leading=16),
    "body":      S("body", fontSize=9.5, leading=14, spaceAfter=3,
                   alignment=TA_JUSTIFY),
    "bullet":    S("bul", fontSize=9.5, leading=13, spaceAfter=2,
                   leftIndent=14),
    "small":     S("sm",  fontSize=8, textColor=C["mgray"],
                   alignment=TA_CENTER, leading=11),
    "tbl_hdr":   S("th",  fontSize=9, fontName="Helvetica-Bold",
                   textColor=C["white"]),
    "tbl_cell":  S("tc",  fontSize=9, textColor=C["text"], leading=12),
    "tbl_key":   S("tk",  fontSize=9, fontName="Helvetica-Bold",
                   textColor=C["accent"]),
    "who_key":   S("wk",  fontSize=9, fontName="Helvetica-Bold",
                   textColor=C["accent"]),
    "who_val":   S("wv",  fontSize=9, textColor=C["text"]),
}

# ── Helpers ────────────────────────────────────────────────
def hr(clr=None, thick=1.5):
    return HRFlowable(width="100%", thickness=thick,
                      color=clr or C["accent"], spaceAfter=6, spaceBefore=4)

def sp(h=0.25):
    return Spacer(1, h * cm)

def p(text, style="body"):
    return Paragraph(text, ST[style])

def bul(text):
    return Paragraph(f"&#8226;&nbsp; {text}", ST["bullet"])

def sec(title):
    return [sp(0.1), p(title, "h1"), hr(C["accent"], 2)]

def sub(title):
    return [sp(0.1), p(title, "h2"), hr(C["accent2"], 0.7)]

def who_box(text):
    t = Table([[p("Who Uses It:", "who_key"), p(text, "who_val")]],
              colWidths=[3.2*cm, 13.8*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), C["eef"]),
        ("TOPPADDING",    (0,0), (-1,-1), 7),
        ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ]))
    return t

def plain_table(data, col_widths, header_bg=None):
    hbg = header_bg or C["bg"]
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0),  hbg),
        ("TEXTCOLOR",     (0,0), (-1,0),  C["white"]),
        ("FONTNAME",      (0,0), (-1,0),  "Helvetica-Bold"),
        ("FONTSIZE",      (0,0), (-1,-1), 9),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [C["white"], C["lgray"]]),
        ("FONTNAME",      (0,1), (-1,-1), "Helvetica"),
        ("TEXTCOLOR",     (0,1), (-1,-1), C["text"]),
        ("GRID",          (0,0), (-1,-1), 0.4, C["border"]),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING",   (0,0), (-1,-1), 7),
        ("RIGHTPADDING",  (0,0), (-1,-1), 7),
    ]))
    return t

# ── Page template callbacks ────────────────────────────────
def on_page(canvas, doc):
    canvas.saveState()
    # header bar
    canvas.setFillColor(C["bg"])
    canvas.rect(0, H - 0.8*cm, W, 0.8*cm, fill=1, stroke=0)
    canvas.setFillColor(C["accent2"])
    canvas.setFont("Helvetica-Bold", 7.5)
    canvas.drawString(1.5*cm, H - 0.55*cm, "SecureCI — Enterprise DevSecOps Platform")
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(C["mgray"])
    canvas.drawRightString(W - 1.5*cm, H - 0.55*cm, "Project Analysis Report")
    # footer
    canvas.setFillColor(C["border"])
    canvas.rect(0, 0, W, 0.7*cm, fill=1, stroke=0)
    canvas.setFillColor(C["mgray"])
    canvas.setFont("Helvetica", 7.5)
    canvas.drawString(1.5*cm, 0.22*cm, f"Generated {datetime.now().strftime('%B %d, %Y')}")
    canvas.drawRightString(W - 1.5*cm, 0.22*cm, f"Page {doc.page}")
    canvas.restoreState()

def on_first_page(canvas, doc):
    canvas.saveState()
    canvas.restoreState()

# ── Cover page ─────────────────────────────────────────────
def cover():
    elems = []
    elems.append(sp(3.5))

    title_block = Table(
        [[p("SecureCI", "cover_h1")]],
        colWidths=[17*cm]
    )
    title_block.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), C["bg"]),
        ("TOPPADDING",    (0,0), (-1,-1), 22),
        ("BOTTOMPADDING", (0,0), (-1,-1), 14),
        ("LEFTPADDING",   (0,0), (-1,-1), 10),
    ]))
    elems.append(title_block)

    sub_block = Table(
        [[p("Enterprise DevSecOps Security Automation Platform", "cover_sub")]],
        colWidths=[17*cm]
    )
    sub_block.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), C["dgray"]),
        ("TOPPADDING",    (0,0), (-1,-1), 10),
        ("BOTTOMPADDING", (0,0), (-1,-1), 10),
    ]))
    elems.append(sub_block)
    elems.append(sp(1.5))

    info = [
        ["Document",  "Full Project Analysis & Feature Reference"],
        ["Version",   "1.0.0"],
        ["Generated", datetime.now().strftime("%B %d, %Y")],
        ["Stack",     "FastAPI · React 18 · PostgreSQL · Redis · Docker"],
        ["Scanners",  "Bandit · Semgrep · Gitleaks · Safety · Trivy"],
        ["Features",  "19 major features across Backend, Frontend & CI/CD"],
    ]
    rows = [[p(f"<b>{k}</b>", "cover_inf"), p(v, "cover_inf")] for k, v in info]
    it = Table(rows, colWidths=[4*cm, 13*cm])
    it.setStyle(TableStyle([
        ("FONTSIZE",      (0,0), (-1,-1), 9.5),
        ("FONTNAME",      (0,0), (0,-1),  "Helvetica-Bold"),
        ("TEXTCOLOR",     (0,0), (0,-1),  C["accent"]),
        ("TEXTCOLOR",     (1,0), (1,-1),  C["text"]),
        ("ROWBACKGROUNDS",(0,0), (-1,-1), [C["white"], C["lgray"]]),
        ("GRID",          (0,0), (-1,-1), 0.4, C["border"]),
        ("TOPPADDING",    (0,0), (-1,-1), 7),
        ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("LEFTPADDING",   (0,0), (-1,-1), 10),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ]))
    elems.append(it)
    elems.append(sp(1.5))
    elems.append(hr(C["accent"], 2))
    elems.append(p("Confidential — Technical Documentation", "small"))
    elems.append(PageBreak())
    return elems

# ── Table of Contents ──────────────────────────────────────
def toc():
    elems = sec("Table of Contents")
    elems.append(sp(0.3))
    sections = [
        ("1",  "Project Overview"),
        ("2",  "Tech Stack"),
        ("3",  "Feature 1  — Authentication & User Management"),
        ("4",  "Feature 2  — Dashboard"),
        ("5",  "Feature 3  — Project Management"),
        ("6",  "Feature 4  — Repository Management"),
        ("7",  "Feature 5  — Security Scanning Engine"),
        ("8",  "Feature 6  — Pipeline Management"),
        ("9",  "Feature 7  — Vulnerability Management"),
        ("10", "Feature 8  — Analytics"),
        ("11", "Feature 9  — Reports"),
        ("12", "Feature 10 — Notifications"),
        ("13", "Feature 11 — Compliance"),
        ("14", "Feature 12 — AI Assistant"),
        ("15", "Feature 13 — Audit Logs"),
        ("16", "Feature 14 — Team Management"),
        ("17", "Feature 15 — Activity Feed"),
        ("18", "Feature 16 — Settings"),
        ("19", "Feature 17 — Profile"),
        ("20", "Feature 18 — GitHub Actions CI Pipeline"),
        ("21", "Feature 19 — Real-Time WebSocket Updates"),
        ("22", "Security Scoring Model"),
        ("23", "Role-Based Access Control (RBAC)"),
        ("24", "How It All Fits Together — Data Flow"),
    ]
    rows = [
        [p(f"<b>{n}.</b>", "tbl_key"), p(t, "tbl_cell")]
        for n, t in sections
    ]
    tbl = Table(rows, colWidths=[1.2*cm, 15.8*cm])
    tbl.setStyle(TableStyle([
        ("ROWBACKGROUNDS",(0,0), (-1,-1), [C["white"], C["lgray"]]),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING",   (0,0), (-1,-1), 6),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("GRID",          (0,0), (-1,-1), 0.3, C["border"]),
    ]))
    elems.append(tbl)
    elems.append(PageBreak())
    return elems

# ── Section 1 — Overview ───────────────────────────────────
def s_overview():
    e = sec("1. Project Overview")
    e.append(p(
        "SecureCI is a full-stack, enterprise-grade DevSecOps automation platform that integrates "
        "directly into software development workflows. Its primary purpose is to continuously scan "
        "code repositories for security vulnerabilities and give development teams a single, central "
        "place to discover, track, and remediate security issues before they reach production."
    ))
    e.append(sp(0.2))
    e.append(p(
        "The platform combines five industry-standard open-source security scanners into a single "
        "automated pipeline, presents findings through an intuitive React dashboard, and delivers "
        "real-time alerts via Slack, Discord, and Email. Reports can be exported in JSON or CSV "
        "format for compliance audits and executive reviews."
    ))
    e.append(sp(0.3))
    e += sub("Core Purpose")
    for item in [
        "Automate security scanning on every code push through GitHub webhooks",
        "Provide a real-time dashboard showing the organisation's overall security posture",
        "Track vulnerability lifecycle from discovery through to remediation",
        "Generate compliance-ready reports mapped to OWASP Top 10 2021",
        "Alert teams immediately when critical issues are found",
        "Enforce security gates in CI/CD pipelines before deployment",
    ]:
        e.append(bul(item))
    e.append(sp(0.3))
    e += sub("Target Audience")
    aud = [
        ["Role", "Primary Use"],
        ["Developers",         "Review scan results, fix vulnerabilities, trigger manual scans"],
        ["Security Engineers", "Configure scanners, triage findings, manage false positives, analyse trends"],
        ["Project Managers",   "View dashboard, download executive reports, track team progress"],
        ["Admins",             "Manage users, configure platform settings, review audit logs"],
    ]
    e.append(plain_table(aud, [4.5*cm, 12.5*cm], C["accent"]))
    e.append(PageBreak())
    return e

# ── Section 2 — Tech Stack ─────────────────────────────────
def s_techstack():
    e = sec("2. Tech Stack")
    e.append(p(
        "SecureCI is built with modern, production-proven technologies chosen for performance, "
        "developer experience, and security-first design."
    ))
    e.append(sp(0.3))
    stack = [
        ["Layer",             "Technology"],
        ["Frontend",          "React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts"],
        ["State Management",  "Zustand (UI/auth state) + TanStack Query (server/cache state)"],
        ["Backend",           "Python 3.11, FastAPI, SQLAlchemy 2.0, Pydantic, Uvicorn"],
        ["Database",          "PostgreSQL 15 (production) / SQLite (local dev fallback)"],
        ["Task Queue",        "Celery 5 + Redis 7 (broker and result backend)"],
        ["Security Scanners", "Bandit, Semgrep, Gitleaks, Safety, Trivy"],
        ["Authentication",    "JWT HS256 (24-hour expiry) + bcrypt password hashing"],
        ["Infrastructure",    "Docker Compose, Nginx reverse proxy, SSL/TLS termination"],
        ["CI/CD",             "GitHub Actions — 8-stage automated security pipeline"],
        ["Testing",           "Vitest (frontend unit tests), pytest (backend with PostgreSQL)"],
        ["Notifications",     "Slack webhooks, Discord webhooks, SMTP email, in-app"],
        ["Real-Time",         "WebSocket (FastAPI native) + socket.io-client"],
        ["PDF/Export",        "jsPDF + html2canvas (frontend), JSON/CSV streaming (backend)"],
    ]
    e.append(plain_table(stack, [5*cm, 12*cm]))
    e.append(PageBreak())
    return e

# ── Feature helper ─────────────────────────────────────────
def feature(num, title, what_it_does, desc, bullets, who, extra=None):
    e = sec(f"{num}. {title}")
    e.append(p(f"<b>What it does:</b> {what_it_does}", "h2"))
    e.append(sp(0.1))
    e.append(p(desc))
    e.append(sp(0.2))
    for b in bullets:
        e.append(bul(b))
    if extra:
        e.append(sp(0.3))
        e += extra
    e.append(sp(0.3))
    e.append(who_box(who))
    e.append(PageBreak())
    return e

# ── Features ───────────────────────────────────────────────
def s_auth():
    return feature(
        "Feature 1", "Authentication & User Management",
        "Handles user registration, login, session management, and profile updates.",
        "Every interaction with SecureCI is gated behind JWT authentication. Passwords are hashed "
        "with bcrypt before storage. On login a signed JWT (HS256, 24-hour expiry) is issued and "
        "stored client-side. All protected API endpoints verify this token on every request via "
        "FastAPI's OAuth2PasswordBearer dependency.",
        [
            "Register with email, username, password, and role selection",
            "JWT-based login — token valid for 24 hours",
            "GET /auth/me endpoint to fetch the current authenticated user's profile",
            "Profile editing: update full name and email address",
            "Password change with current-password verification",
            "Roles: admin, security_engineer, developer, pm — each with different permissions",
            "RBAC enforced at API level (e.g. only admins can manage users)",
            "Admin can deactivate user accounts to revoke access without deleting history",
            "Duplicate email and username detection at registration",
            "Last login timestamp tracked per user",
        ],
        "Every user of the platform. Admins manage the team.",
    )

def s_dashboard():
    return feature(
        "Feature 2", "Dashboard",
        "Provides a real-time overview of the entire security posture.",
        "The dashboard is the home screen of SecureCI. It aggregates live data from the database "
        "and presents it as KPI metric cards, trend charts, and a live pipeline feed. "
        "A WebSocket connection keeps all metrics updated without manual page refresh.",
        [
            "Overall security score (0–100) and letter grade (A+ to F)",
            "Counts of open vulnerabilities by severity: critical, high, medium, low",
            "Total scans run, active pipelines, projects count, repositories count",
            "7-day scan activity sparkline / trend chart",
            "7-day vulnerability discovery trend chart",
            "Risk distribution pie/donut chart broken down by severity",
            "Top 10 critical/high open vulnerabilities for immediate attention",
            "Recent pipeline runs with per-stage status indicators",
            "Scanner statistics: findings count per tool (Bandit, Semgrep, etc.)",
            "Live updates pushed via WebSocket at /ws/dashboard",
        ],
        "All team members — the primary entry point and security health snapshot.",
    )

def s_projects():
    return feature(
        "Feature 3", "Project Management",
        "Organizes work into projects, each containing one or more repositories.",
        "Projects are the top-level organisational unit. Each project groups related repositories "
        "and aggregates their security scores into a single project-level grade. This lets teams "
        "track security health by product line, team, or business unit.",
        [
            "Create, read, update, and delete projects",
            "Each project tracks its own aggregate security score and letter grade",
            "Repository count displayed per project",
            "Owner-based access control — only the owner or an admin can edit/delete",
            "Paginated project listing with skip/limit query parameters",
            "Cascade delete: removing a project removes all linked repositories, pipelines, scans, and vulnerabilities",
        ],
        "Team leads and developers grouping related repositories.",
    )

def s_repos():
    return feature(
        "Feature 4", "Repository Management",
        "Links external Git repositories to projects for continuous security monitoring.",
        "Repositories are the direct targets of security scans. Each repository is connected to "
        "a project and can be hooked into a GitHub/GitLab webhook so every code push automatically "
        "triggers a full pipeline. The platform continuously tracks per-repository security metrics.",
        [
            "Add repositories from GitHub, GitLab, Bitbucket, or any Git provider",
            "Store webhook URL and secret for automated push-triggered scans",
            "Track per-repo metrics: scan count, open vulnerability count, security score, grade",
            "Record last commit info: SHA, message, author name, timestamp",
            "Support for both public and private repositories",
            "Default branch configuration (main, master, develop, etc.)",
            "Paginated, filterable repository listing",
        ],
        "Developers and security engineers connecting codebases for monitoring.",
    )

def s_scanning():
    scanner_tbl_data = [
        ["Scanner",   "Type",                  "What It Detects"],
        ["Bandit",    "Python SAST",            "SQL injection, hardcoded passwords, weak crypto, insecure function usage"],
        ["Semgrep",   "Multi-language SAST",    "Path traversal, XSS, missing security headers, custom rule violations"],
        ["Gitleaks",  "Secret Detection",       "Hardcoded API keys, tokens, credentials in source and full git history"],
        ["Safety",    "Dependency CVE Check",   "Known CVEs in Python packages listed in requirements.txt"],
        ["Trivy",     "Container Scanning",     "OS-level CVEs in Docker base images and installed system packages"],
    ]
    row_bgs = [C["white"], C["lgray"], C["white"], C["lgray"], C["white"]]
    sev_colors = [
        colors.HexColor("#fef2f2"),
        colors.HexColor("#fff7ed"),
        colors.HexColor("#fefce8"),
        colors.HexColor("#f0fdf4"),
        colors.HexColor("#eff6ff"),
    ]
    st = Table(scanner_tbl_data, colWidths=[2.8*cm, 3.8*cm, 10.4*cm], repeatRows=1)
    cmds = [
        ("BACKGROUND",    (0,0), (-1,0),  C["bg"]),
        ("TEXTCOLOR",     (0,0), (-1,0),  C["white"]),
        ("FONTNAME",      (0,0), (-1,0),  "Helvetica-Bold"),
        ("FONTSIZE",      (0,0), (-1,-1), 9),
        ("FONTNAME",      (0,1), (-1,-1), "Helvetica"),
        ("TEXTCOLOR",     (0,1), (-1,-1), C["text"]),
        ("GRID",          (0,0), (-1,-1), 0.4, C["border"]),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",    (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING",   (0,0), (-1,-1), 7),
        ("FONTNAME",      (0,1), (0,-1),  "Helvetica-Bold"),
    ]
    for i, c in enumerate(sev_colors):
        cmds.append(("BACKGROUND", (0, i+1), (0, i+1), c))
    st.setStyle(TableStyle(cmds))

    extra = sub("Five Scanners — Side by Side") + [st]
    return feature(
        "Feature 5", "Security Scanning Engine",
        "Runs five security scanners in parallel against code and stores all findings.",
        "The scanning engine is the core of SecureCI. When a scan is triggered — manually or via "
        "webhook — the system creates one scan record per scanner (five total), then launches each "
        "as a background thread (Celery in production). Results are normalised into a unified schema "
        "and stored as Vulnerability records. Each finding includes file path, line number, code "
        "snippet, CVE/CWE IDs, OWASP category, CVSS score, and a fix recommendation.",
        [
            "Five scanners run in parallel per pipeline trigger",
            "Bandit — Python SAST: SQL injection, hardcoded secrets, weak crypto, assert misuse",
            "Semgrep — Multi-language SAST: path traversal, XSS, missing security headers",
            "Gitleaks — Secret detection: API keys, tokens, credentials across full git history",
            "Safety — Dependency CVE scan: checks requirements.txt against CVE database",
            "Trivy — Container scan: OS-level CVEs in Docker base images",
            "All scanners run in background threads; Celery + Redis in production",
            "Findings normalised to unified schema: title, severity, file_path, line_number, code_snippet, CVE, CWE, OWASP, CVSS, fix",
            "Security score calculated: 100 minus deductions (25 per critical, 15 per high, 7 per medium, 3 per low)",
            "Repository security score and grade updated automatically after each completed scan",
            "Fallback simulation mode for demo/dev environments without scanners installed",
        ],
        "Automated on every code push (webhook) or triggered manually.",
        extra=extra,
    )

def s_pipelines():
    return feature(
        "Feature 6", "Pipeline Management",
        "Tracks and visualizes CI/CD security pipeline runs stage by stage.",
        "Every scan trigger creates a Pipeline record that groups all five scanner scans into four "
        "logical stages. The pipeline lifecycle progresses through pending → running → completed / "
        "failed / cancelled. Users can drill into each stage to see status, duration, and findings.",
        [
            "Each trigger creates one pipeline with 4 stages: Static Scan → Secrets Scan → Dependency Scan → Container Scan",
            "Stages derived from individual scanner scans (Bandit+Semgrep → Static, Gitleaks → Secrets, etc.)",
            "Pipeline statuses: pending, running, completed, failed, cancelled",
            "Per-stage detail: status, start time, completion time, duration, finding count",
            "Cancel a running pipeline via POST /{pipeline_id}/cancel",
            "Filter pipeline list by repository or status",
            "Live WebSocket updates pushed to the browser as each scan completes (/ws/pipeline/{id})",
            "Triggered-by field records which user or webhook initiated the run",
            "Pipeline total duration tracked in seconds",
        ],
        "Developers watching live scan runs; security engineers reviewing pipeline history.",
    )

def s_vulns():
    return feature(
        "Feature 7", "Vulnerability Management",
        "Central database of all discovered security issues with full lifecycle management.",
        "Every finding produced by the scanners becomes a persistent Vulnerability record with a "
        "complete information set. The platform provides a rich management interface: filter by any "
        "dimension, view full technical detail, and manage the issue lifecycle from open through to resolved.",
        [
            "List all vulnerabilities with filters: severity, status, scanner, repository, keyword search (title/description/CVE)",
            "Full detail view: description, affected file path and line number, code snippet",
            "CVE ID, CWE ID, OWASP Top 10 2021 category, CVSS score per finding",
            "Fix recommendation and external reference links per finding",
            "Status lifecycle: open → fixed / accepted / false_positive",
            "Mark false positives with a written reason recorded",
            "Aggregate stats endpoint: count by severity + current security score calculation",
            "Pagination: up to 200 findings per page with skip/limit support",
        ],
        "Developers fixing issues; security engineers triaging and managing risk.",
    )

def s_analytics():
    return feature(
        "Feature 8", "Analytics",
        "Historical data and trend analysis for security metrics.",
        "The analytics module provides time-series and aggregated views of security data, enabling "
        "teams to track improvement over time, identify the most vulnerable repositories, and "
        "understand which scanners are finding the most issues.",
        [
            "Monthly vulnerability trends for the past 1–12 months broken down by severity",
            "Scanner breakdown: finding counts and severity split per tool",
            "Top vulnerable repositories ranked by open vulnerability count with score and grade",
            "Pipeline success/failure rate over a configurable time window (7–90 days)",
            "Daily scan activity chart for the past 1–30 days",
            "All charts rendered with Recharts (line, bar, pie, area chart types)",
        ],
        "Security engineers and managers measuring security improvement over time.",
    )

def s_reports():
    rt = [
        ["Report Type",       "Audience",           "Contents"],
        ["Developer",         "Developers",         "File paths, line numbers, code snippets, fix recommendations"],
        ["Executive Summary", "Management / Board", "Narrative text, security grade, risk level, top 10 findings"],
        ["Compliance",        "Audit Teams",        "OWASP Top 10 2021 mapping, pass/fail per category"],
        ["OWASP Report",      "Security Engineers", "All findings grouped by each of the 10 OWASP categories"],
    ]
    rt_tbl = plain_table(rt, [3.8*cm, 4*cm, 9.2*cm], C["accent"])
    extra = sub("Report Types") + [rt_tbl]
    return feature(
        "Feature 9", "Reports",
        "Generates downloadable security reports in multiple formats and styles.",
        "SecureCI can produce four distinct report types targeting different audiences, all "
        "exportable in JSON or CSV. An executive summary auto-generates narrative text with a "
        "security grade suitable for board-level review. Compliance reports map findings directly "
        "to OWASP Top 10 2021 categories for audit evidence.",
        [
            "Four report types: Developer, Executive Summary, Compliance, OWASP",
            "Developer report — technical details: file paths, line numbers, code snippets, fix recommendations",
            "Executive summary — auto-generated narrative, security grade, risk level, top findings",
            "Compliance report — OWASP Top 10 2021 mapping showing which categories pass/fail",
            "OWASP report — findings grouped by each of the 10 OWASP 2021 categories",
            "Export formats: JSON (structured, machine-readable) and CSV (spreadsheet-ready)",
            "Security score and letter grade included in all report types",
            "Reports downloadable directly from the API as file attachments",
            "Report records saved to the database for audit history",
            "Background async generation via Celery for large datasets",
        ],
        "Developers (fixes), managers/executives (board review), compliance teams (audit evidence).",
        extra=extra,
    )

def s_notifications():
    ch = [
        ["Channel",  "Method",                 "Format"],
        ["In-App",   "Database + WebSocket",   "Notification bell, list, mark read, delete"],
        ["Slack",    "Webhook POST",            "Rich embed with severity colour coding"],
        ["Discord",  "Webhook POST",            "Embed with severity colour integer"],
        ["Email",    "SMTP + starttls",         "HTML formatted message"],
    ]
    ch_tbl = plain_table(ch, [3*cm, 4.5*cm, 9.5*cm])
    extra = sub("Delivery Channels") + [ch_tbl]
    return feature(
        "Feature 10", "Notifications",
        "Alerts team members about security events through multiple channels.",
        "The notification system dispatches security alerts through all configured channels whenever "
        "a significant event occurs. Each notification type is colour-coded by severity for instant "
        "visual triage. Delivery is handled by Celery workers so it never blocks the API response.",
        [
            "Trigger: Critical vulnerability discovered — immediate alert on all channels",
            "Trigger: Pipeline failed a security check — warning with failed stage and reason",
            "Trigger: Deployment blocked due to findings — critical alert with counts",
            "Trigger: Scan completed — result summary with score, grade, total findings",
            "Trigger: Daily digest — aggregated summary of last 24 hours (Celery beat, every 24h)",
            "In-app: list, mark as read, mark all as read, delete individual notifications",
            "Slack: webhook-based rich embeds, colour-coded by severity (#ef4444 critical, etc.)",
            "Discord: embed-based alerts with severity colour integers",
            "Email: SMTP with HTML formatting via starttls",
            "Celery task queue ensures delivery does not block the API response",
        ],
        "The whole team. Critical alerts to security engineers; scan completions to developers.",
        extra=extra,
    )

def s_compliance():
    return feature(
        "Feature 11", "Compliance",
        "Maps findings to OWASP Top 10 2021 and shows compliance status per category.",
        "The compliance page maps all discovered vulnerabilities to their OWASP Top 10 2021 "
        "categories and instantly shows which categories have active violations. This provides "
        "audit-ready evidence of the organisation's compliance posture.",
        [
            "Maps every finding to its OWASP category (A01:2021 — Broken Access Control through A10:2021)",
            "Pass/fail status per category based on active critical/high severity findings",
            "Count of critical and high findings per OWASP category",
            "Unmapped findings counted and shown separately",
            "Overall compliance score displayed as N/10 categories passing",
            "Exportable as an OWASP Report (JSON/CSV) for submission to auditors",
        ],
        "Security engineers and compliance/audit teams.",
    )

def s_ai():
    return feature(
        "Feature 12", "AI Assistant",
        "An AI-powered chat interface for security guidance inside the platform.",
        "The AI Assistant provides a conversational interface where developers can ask security "
        "questions directly within SecureCI, without switching to external tools. Responses are "
        "rendered with full Markdown support including syntax-highlighted code blocks.",
        [
            "Dedicated /ai-assistant page with a full-screen chat UI",
            "Ask questions about specific vulnerabilities, CVEs, or security concepts",
            "Get remediation advice contextual to the project's own scan findings",
            "Markdown rendering for rich responses with code snippets (react-markdown library)",
            "Accessible from the main navigation sidebar at all times",
        ],
        "Developers seeking remediation advice without leaving the platform.",
    )

def s_audit():
    return feature(
        "Feature 13", "Audit Logs",
        "Records every significant action taken by users in the system.",
        "Every create, update, delete, login, and scan-trigger action is written to an immutable "
        "audit log. This provides a complete, tamper-evident history useful for security "
        "investigations, compliance audits, and access reviews.",
        [
            "Logs every user action: login, create/update/delete on all resources, scan triggers",
            "Records: user ID, action type, resource type, resource ID, timestamp, IP address",
            "Immutable — audit records cannot be edited or deleted through the API",
            "Dedicated /audit UI page with browsable, searchable history",
            "Useful for: incident investigation, compliance evidence, insider threat detection",
        ],
        "Admins and compliance/audit teams reviewing user behaviour.",
    )

def s_team():
    return feature(
        "Feature 14", "Team Management",
        "Manage team members and their roles across the platform.",
        "The Team page gives administrators a central view of all active platform users. Role "
        "assignment controls what each team member can see and do, enforced at the API level on "
        "every request.",
        [
            "List all active team members with role, email, and last login timestamp",
            "Role management by admins: assign admin, security_engineer, developer, or pm",
            "Admin can deactivate accounts to revoke access without deleting historical data",
            "User count per role visible for capacity and access planning",
        ],
        "Admins and team leads.",
    )

def s_activity():
    return feature(
        "Feature 15", "Activity Feed",
        "A chronological feed of events across the platform.",
        "The Activity page presents a reverse-chronological timeline of everything happening "
        "across the platform — scans triggered, pipelines completed or failed, vulnerabilities "
        "discovered, and reports generated.",
        [
            "Reverse-chronological timeline of all platform events",
            "Events include: scan triggered, pipeline completed/failed, vulnerability found, report generated",
            "Filterable by event type or resource",
            "Provides a narrative story-of-what-happened complementing the Dashboard metrics",
        ],
        "All team members who want a timeline view of platform activity.",
    )

def s_settings():
    return feature(
        "Feature 16", "Settings",
        "Configure platform-wide and personal notification/scanner settings.",
        "Settings covers all configurable aspects of the platform: which notification channels "
        "are active, which severity levels trigger alerts, scanner enable/disable toggles per "
        "project, and API key management for programmatic access.",
        [
            "Notification preferences: enable/disable per channel (email, Slack, Discord, in-app)",
            "Severity thresholds: choose which severity levels trigger notifications",
            "Slack webhook URL configuration",
            "Discord webhook URL configuration",
            "Scanner configuration: enable/disable individual scanners (Bandit, Semgrep, etc.) per project",
            "API key management for CI/CD or programmatic access to the platform",
        ],
        "Admins for global settings; individual users for personal notification preferences.",
    )

def s_profile():
    return feature(
        "Feature 17", "Profile",
        "Personal account management page for every user.",
        "The Profile page lets each user manage their own account details independently of admin "
        "controls. It provides a self-service interface for updating contact info and credentials.",
        [
            "View and edit full name and email address",
            "Change password with current-password verification required",
            "View assigned role and last login timestamp",
            "Avatar URL field for profile picture",
        ],
        "Every user managing their own account.",
    )

def s_github():
    jobs = [
        ["Job #", "Name",                   "What It Runs"],
        ["1",  "Static Analysis",          "Bandit + Semgrep on backend and security-engine code"],
        ["2",  "Secrets Detection",        "Gitleaks on full git history (fetch-depth: 0)"],
        ["3",  "Dependency Scan",          "Safety + pip-audit on requirements.txt"],
        ["4",  "Container Scan",           "Trivy on the built Docker image (CRITICAL, HIGH)"],
        ["5",  "Frontend Tests",           "Vitest test suite + TypeScript build check"],
        ["6",  "Backend Tests",            "pytest with live PostgreSQL service container + coverage"],
        ["7",  "Security Report",          "Aggregated summary posted to GitHub Actions step summary"],
        ["8",  "Deploy",                   "Runs only on main branch after all checks pass"],
    ]
    jt = plain_table(jobs, [1.2*cm, 4.5*cm, 11.3*cm], C["bg"])
    extra = sub("Pipeline Jobs") + [jt]
    return feature(
        "Feature 18", "GitHub Actions CI Pipeline",
        "The project runs its own 8-stage security pipeline on every push.",
        "SecureCI is secured using its own methodology. A GitHub Actions workflow runs automatically "
        "on every push and pull request, executing the same scanners the platform uses on external "
        "projects — on itself. This provides a self-validating security posture.",
        [
            "Triggered on: push to main/develop/feature/**, and all pull requests",
            "Concurrency group cancels in-progress runs on new pushes to the same branch",
            "All scan reports uploaded as GitHub Actions artifacts (retained 30 days)",
            "Backend tests run against a real PostgreSQL 15 service container",
            "Deploy job blocked unless ALL 7 prior jobs pass",
            "Security report job always runs (if: always()) to capture partial results",
        ],
        "The CI/CD pipeline — automated on every push/PR.",
        extra=extra,
    )

def s_websocket():
    return feature(
        "Feature 19", "Real-Time WebSocket Updates",
        "Pushes live updates to the browser without requiring a page refresh.",
        "SecureCI maintains persistent WebSocket connections to push live data to every connected "
        "browser tab. Scan progress appears in real time without polling, and dashboard metrics "
        "update automatically as new findings are stored.",
        [
            "/ws/pipeline/{pipeline_id} — live stage-by-stage progress as a scan runs",
            "/ws/dashboard — live metric updates pushed to the main dashboard",
            "Connection manager groups clients by channel and broadcasts JSON payloads",
            "Dead/disconnected clients cleaned up automatically on next broadcast",
            "Frontend uses socket.io-client for WebSocket lifecycle management",
            "Multiple concurrent clients per channel all receive the same broadcast",
        ],
        "Anyone watching a pipeline run or the live dashboard.",
    )

# ── Scoring model ──────────────────────────────────────────
def s_scoring():
    e = sec("22. Security Scoring Model")
    e.append(p(
        "SecureCI calculates a security score (0–100) for every scan, repository, and project. "
        "The score starts at 100 and deductions are applied based on the number and severity of "
        "open vulnerabilities. Deductions are capped per severity band to prevent a single scanner "
        "type from dominating the score."
    ))
    e.append(sp(0.3))
    e += sub("Deduction Table")
    scoring = [
        ["Severity", "Points Deducted Each", "Maximum Deduction", "CVSS Range"],
        ["Critical",  "25 pts",  "60 pts (cap)",  "9.0 – 10.0"],
        ["High",      "15 pts",  "40 pts (cap)",  "7.0 – 8.9"],
        ["Medium",    "7 pts",   "25 pts (cap)",  "4.0 – 6.9"],
        ["Low",       "3 pts",   "10 pts (cap)",  "0.1 – 3.9"],
    ]
    sev_bg = [C["crit"], C["high"], C["med"], C["low"]]
    st = Table(scoring, colWidths=[3*cm, 4.5*cm, 4.5*cm, 5*cm], repeatRows=1)
    cmds = [
        ("BACKGROUND",    (0,0), (-1,0),  C["bg"]),
        ("TEXTCOLOR",     (0,0), (-1,0),  C["white"]),
        ("FONTNAME",      (0,0), (-1,0),  "Helvetica-Bold"),
        ("FONTSIZE",      (0,0), (-1,-1), 9),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [C["white"], C["lgray"]]),
        ("FONTNAME",      (0,1), (-1,-1), "Helvetica"),
        ("TEXTCOLOR",     (0,1), (-1,-1), C["text"]),
        ("ALIGN",         (1,0), (-1,-1), "CENTER"),
        ("GRID",          (0,0), (-1,-1), 0.4, C["border"]),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",    (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING",   (0,0), (-1,-1), 7),
    ]
    for i, c in enumerate(sev_bg):
        cmds += [
            ("BACKGROUND", (0, i+1), (0, i+1), c),
            ("TEXTCOLOR",  (0, i+1), (0, i+1), C["white"]),
            ("FONTNAME",   (0, i+1), (0, i+1), "Helvetica-Bold"),
        ]
    st.setStyle(TableStyle(cmds))
    e.append(st)
    e.append(sp(0.4))
    e += sub("Grade Scale")
    grades = [
        ["Score Range", "Grade", "Risk Level"],
        ["95 – 100",    "A+",    "Very Low"],
        ["85 – 94",     "A",     "Low"],
        ["75 – 84",     "B",     "Low-Medium"],
        ["60 – 74",     "C",     "Medium"],
        ["50 – 59",     "D",     "High"],
        ["0  – 49",     "F",     "Critical"],
    ]
    grade_bg = [
        colors.HexColor("#dcfce7"), colors.HexColor("#dcfce7"),
        colors.HexColor("#d1fae5"), colors.HexColor("#fef9c3"),
        colors.HexColor("#ffedd5"), colors.HexColor("#fee2e2"),
    ]
    gt = Table(grades, colWidths=[4*cm, 3*cm, 4*cm], repeatRows=1)
    gcmds = [
        ("BACKGROUND",    (0,0), (-1,0),  C["bg"]),
        ("TEXTCOLOR",     (0,0), (-1,0),  C["white"]),
        ("FONTNAME",      (0,0), (-1,0),  "Helvetica-Bold"),
        ("FONTSIZE",      (0,0), (-1,-1), 9),
        ("FONTNAME",      (0,1), (-1,-1), "Helvetica"),
        ("TEXTCOLOR",     (0,1), (-1,-1), C["text"]),
        ("ALIGN",         (1,0), (1,-1),  "CENTER"),
        ("FONTNAME",      (1,1), (1,-1),  "Helvetica-Bold"),
        ("GRID",          (0,0), (-1,-1), 0.4, C["border"]),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",    (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING",   (0,0), (-1,-1), 7),
    ]
    for i, c in enumerate(grade_bg):
        gcmds.append(("BACKGROUND", (0, i+1), (-1, i+1), c))
    gt.setStyle(TableStyle(gcmds))
    e.append(gt)
    e.append(PageBreak())
    return e

# ── RBAC ───────────────────────────────────────────────────
def s_rbac():
    e = sec("23. Role-Based Access Control (RBAC)")
    e.append(p(
        "SecureCI enforces role-based permissions at the API level on every request. The four "
        "roles — admin, security_engineer, developer, and pm — grant different levels of access "
        "to platform features. Permissions are checked inside each FastAPI endpoint using the "
        "current_user dependency."
    ))
    e.append(sp(0.3))
    rbac = [
        ["Action",                   "Admin", "Sec Eng", "Developer", "PM"],
        ["View Dashboard",           "✅",    "✅",      "✅",        "✅"],
        ["Trigger Scan",             "✅",    "✅",      "✅",        "❌"],
        ["Delete Vulnerabilities",   "✅",    "✅",      "❌",        "❌"],
        ["Manage Users",             "✅",    "❌",      "❌",        "❌"],
        ["Generate Reports",         "✅",    "✅",      "✅",        "✅"],
        ["Configure Scanners",       "✅",    "✅",      "❌",        "❌"],
        ["Manage API Keys",          "✅",    "❌",      "❌",        "❌"],
        ["Cancel Pipelines",         "✅",    "✅",      "✅",        "❌"],
        ["Mark False Positives",     "✅",    "✅",      "❌",        "❌"],
        ["Deactivate Users",         "✅",    "❌",      "❌",        "❌"],
        ["View Audit Logs",          "✅",    "✅",      "❌",        "❌"],
    ]
    rt = Table(rbac, colWidths=[6*cm, 2.2*cm, 2.5*cm, 2.8*cm, 2.2*cm], repeatRows=1)
    rt.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0),  C["bg"]),
        ("TEXTCOLOR",     (0,0), (-1,0),  C["white"]),
        ("FONTNAME",      (0,0), (-1,0),  "Helvetica-Bold"),
        ("FONTSIZE",      (0,0), (-1,-1), 9),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [C["white"], C["lgray"]]),
        ("FONTNAME",      (0,1), (-1,-1), "Helvetica"),
        ("TEXTCOLOR",     (0,1), (-1,-1), C["text"]),
        ("ALIGN",         (1,0), (-1,-1), "CENTER"),
        ("GRID",          (0,0), (-1,-1), 0.4, C["border"]),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING",   (0,0), (-1,-1), 7),
    ]))
    e.append(rt)
    e.append(PageBreak())
    return e

# ── Data flow ──────────────────────────────────────────────
def s_dataflow():
    e = sec("24. How It All Fits Together — Data Flow")
    e.append(p(
        "The diagram below shows the complete journey of a security event from the moment a "
        "developer pushes code through to the team reviewing findings and generating a compliance report."
    ))
    e.append(sp(0.3))
    steps = [
        ("1",  C["accent"],  "Developer pushes code to the repository"),
        ("2",  C["accent"],  "GitHub webhook fires a POST to FastAPI /webhook endpoint"),
        ("3",  C["dgray"],   "FastAPI creates one Pipeline record and five Scan records (one per scanner)"),
        ("4",  C["dgray"],   "Five background threads (or Celery tasks) launched in parallel"),
        ("5",  C["crit"],    "Bandit scans Python source for insecure patterns"),
        ("5",  C["high"],    "Semgrep scans all languages for security rule violations"),
        ("5",  C["med"],     "Gitleaks scans git history for hardcoded secrets"),
        ("5",  C["low"],     "Safety checks requirements.txt for known CVEs"),
        ("5",  C["ok"],      "Trivy scans the Docker image for OS-level CVEs"),
        ("6",  C["dgray"],   "Findings normalised to unified schema and stored as Vulnerability records"),
        ("7",  C["dgray"],   "Repository security score and grade recalculated"),
        ("8",  C["dgray"],   "Pipeline status updated to completed or failed"),
        ("9",  C["accent"],  "Notifications dispatched: Slack, Discord, Email, in-app"),
        ("10", C["accent"],  "Dashboard updated via WebSocket broadcast"),
        ("11", C["dgray"],   "User reviews findings in the Vulnerability Management page"),
        ("12", C["dgray"],   "User marks findings as fixed, accepted, or false positive"),
        ("13", C["ok"],      "Report generated (Developer / Executive / OWASP / Compliance)"),
        ("14", C["ok"],      "Report downloaded as JSON or CSV for audit submission"),
    ]
    rows = []
    for num, clr, text in steps:
        step_cell = Table([[Paragraph(num, ParagraphStyle(
            "sn", fontSize=8, fontName="Helvetica-Bold",
            textColor=C["white"], alignment=TA_CENTER))]],
            colWidths=[0.7*cm], rowHeights=[0.5*cm])
        step_cell.setStyle(TableStyle([
            ("BACKGROUND",    (0,0), (-1,-1), clr),
            ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
            ("TOPPADDING",    (0,0), (-1,-1), 0),
            ("BOTTOMPADDING", (0,0), (-1,-1), 0),
        ]))
        rows.append([step_cell, Paragraph(text, ST["body"])])
    flow_tbl = Table(rows, colWidths=[1*cm, 16*cm])
    flow_tbl.setStyle(TableStyle([
        ("ROWBACKGROUNDS", (0,0), (-1,-1), [C["white"], C["lgray"]]),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING",   (0,0), (-1,-1), 4),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("GRID",          (0,0), (-1,-1), 0.3, C["border"]),
    ]))
    e.append(flow_tbl)
    e.append(sp(0.5))
    e.append(hr(C["accent"], 1))
    e.append(p("End of SecureCI Project Analysis Report", "small"))
    e.append(p(f"Generated {datetime.now().strftime('%B %d, %Y at %H:%M')} — SecureCI v1.0.0", "small"))
    return e

# ── Main build ─────────────────────────────────────────────
def build():
    doc = SimpleDocTemplate(
        OUT,
        pagesize=A4,
        leftMargin=1.5*cm,
        rightMargin=1.5*cm,
        topMargin=1.5*cm,
        bottomMargin=1.5*cm,
        title="SecureCI — Project Analysis Report",
        author="SecureCI Platform",
        subject="Enterprise DevSecOps Security Automation Platform",
    )

    story = []
    story += cover()
    story += toc()
    story += s_overview()
    story += s_techstack()
    story += s_auth()
    story += s_dashboard()
    story += s_projects()
    story += s_repos()
    story += s_scanning()
    story += s_pipelines()
    story += s_vulns()
    story += s_analytics()
    story += s_reports()
    story += s_notifications()
    story += s_compliance()
    story += s_ai()
    story += s_audit()
    story += s_team()
    story += s_activity()
    story += s_settings()
    story += s_profile()
    story += s_github()
    story += s_websocket()
    story += s_scoring()
    story += s_rbac()
    story += s_dataflow()

    doc.build(
        story,
        onFirstPage=on_first_page,
        onLaterPages=on_page,
    )
    print(f"PDF saved → {OUT}")

if __name__ == "__main__":
    build()
