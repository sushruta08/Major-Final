/**
 * Formatting utilities for dates, durations, scores, and severity display.
 */
import { formatDistanceToNow, format, parseISO } from 'date-fns'
import type { SecurityGrade, SeverityLevel } from '../types'

// ── Date formatting ────────────────────────────────────────

export function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true })
  } catch {
    return dateStr
  }
}

export function formatDate(dateStr: string, pattern = 'MMM d, yyyy'): string {
  try {
    return format(parseISO(dateStr), pattern)
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr: string): string {
  return formatDate(dateStr, 'MMM d, yyyy HH:mm')
}

// ── Duration ──────────────────────────────────────────────

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

// ── Score / Grade ─────────────────────────────────────────

export function gradeColor(grade: SecurityGrade): string {
  const map: Record<SecurityGrade, string> = {
    'A+': '#10b981',
    'A':  '#22c55e',
    'B':  '#3b82f6',
    'C':  '#eab308',
    'D':  '#f97316',
    'F':  '#ef4444',
  }
  return map[grade] ?? '#64748b'
}

export function scoreToGrade(score: number): SecurityGrade {
  if (score >= 95) return 'A+'
  if (score >= 85) return 'A'
  if (score >= 75) return 'B'
  if (score >= 60) return 'C'
  if (score >= 50) return 'D'
  return 'F'
}

// ── Severity ──────────────────────────────────────────────

export function severityColor(severity: SeverityLevel): string {
  const map: Record<SeverityLevel, string> = {
    critical: '#ef4444',
    high:     '#f97316',
    medium:   '#eab308',
    low:      '#3b82f6',
    info:     '#64748b',
  }
  return map[severity] ?? '#64748b'
}

export function severityWeight(severity: SeverityLevel): number {
  const map: Record<SeverityLevel, number> = {
    critical: 5, high: 4, medium: 3, low: 2, info: 1,
  }
  return map[severity] ?? 0
}

export function sortBySeverity<T extends { severity: SeverityLevel }>(items: T[]): T[] {
  return [...items].sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity))
}

// ── Numbers ───────────────────────────────────────────────

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

// ── CVSS Score ────────────────────────────────────────────

export function cvssLabel(score: number): string {
  if (score >= 9.0) return 'Critical'
  if (score >= 7.0) return 'High'
  if (score >= 4.0) return 'Medium'
  if (score > 0)    return 'Low'
  return 'None'
}

export function cvssColor(score: number): string {
  if (score >= 9.0) return '#ef4444'
  if (score >= 7.0) return '#f97316'
  if (score >= 4.0) return '#eab308'
  if (score > 0)    return '#3b82f6'
  return '#64748b'
}
