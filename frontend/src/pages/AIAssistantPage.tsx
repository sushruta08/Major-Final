import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bot, Send, Sparkles, Shield, Code, AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import type { ChatMessage } from '../types'

const QUICK_ACTIONS = [
  { label: 'Explain SQL Injection', icon: Shield, prompt: 'Explain SQL injection vulnerabilities and how to prevent them in Python' },
  { label: 'Fix CVE-2024-1234', icon: AlertTriangle, prompt: 'How do I fix CVE-2024-1234 SQL injection in a Django application?' },
  { label: 'Secure Code Review', icon: Code, prompt: 'Review this code for security vulnerabilities:\n```python\ncursor.execute("SELECT * FROM users WHERE email=\'" + email + "\'")\n```' },
  { label: 'OWASP Top 10', icon: Sparkles, prompt: 'Give me a summary of OWASP Top 10 2021 vulnerabilities with examples' },
]

const AI_RESPONSES: Record<string, string> = {
  default: `I'm **SecureCI AI Assistant** — your DevSecOps security expert. I can help you:

- 🛡️ **Explain vulnerabilities** — CVEs, CWEs, OWASP categories
- 🔧 **Suggest fixes** — Code remediation, secure patterns
- 📋 **Security best practices** — OWASP, NIST, CIS guidelines
- 🔍 **Analyze scan results** — Interpret findings from Bandit, Semgrep, Trivy
- 💡 **Generate secure code** — Authentication, input validation, encryption

What security challenge can I help you with today?`,

  sql: `## SQL Injection Prevention

SQL injection is one of the most critical vulnerabilities (OWASP A03:2021).

### Vulnerable Code ❌
\`\`\`python
# NEVER do this
cursor.execute("SELECT * FROM users WHERE email='" + email + "'")
\`\`\`

### Secure Code ✅
\`\`\`python
# Use parameterized queries
cursor.execute("SELECT * FROM users WHERE email = %s", (email,))

# Or better — use SQLAlchemy ORM
user = db.session.query(User).filter_by(email=email).first()
\`\`\`

### Key Prevention Strategies:
1. **Parameterized Queries** — Always use placeholders
2. **ORM Usage** — SQLAlchemy, Django ORM handle escaping
3. **Input Validation** — Whitelist allowed characters
4. **Least Privilege** — DB user should have minimal permissions
5. **WAF** — Web Application Firewall as defense-in-depth

**CVSS Score:** 9.8 Critical | **CWE:** CWE-89 | **OWASP:** A03:2021`,

  owasp: `## OWASP Top 10 (2021)

| # | Category | Description | Example |
|---|----------|-------------|---------|
| A01 | Broken Access Control | Unauthorized resource access | IDOR, privilege escalation |
| A02 | Cryptographic Failures | Weak/missing encryption | MD5 passwords, HTTP |
| A03 | Injection | Untrusted data sent to interpreter | SQL, NoSQL, OS injection |
| A04 | Insecure Design | Flawed architecture | Missing threat modeling |
| A05 | Security Misconfiguration | Default configs, verbose errors | Open S3 buckets |
| A06 | Vulnerable Components | Outdated dependencies | Log4Shell, Heartbleed |
| A07 | Auth Failures | Weak authentication | No MFA, weak passwords |
| A08 | Software/Data Integrity | Unsigned updates/pipelines | CI/CD compromise |
| A09 | Logging Failures | Insufficient audit trails | No breach detection |
| A10 | SSRF | Server-side request forgery | Cloud metadata access |

**Most Critical for CI/CD:** A08 (Software Integrity), A06 (Vulnerable Components), A05 (Misconfiguration)`,

  cve: `## CVE-2024-1234 — Django SQL Injection

**Severity:** Critical (CVSS 9.8)  
**Affected:** Django < 4.2.11, Django < 5.0.3

### Description
Improper neutralization of user-supplied data in raw SQL queries allows remote attackers to execute arbitrary SQL commands.

### Affected Code Pattern
\`\`\`python
# Vulnerable
User.objects.raw("SELECT * FROM auth_user WHERE email='" + email + "'")
\`\`\`

### Fix
\`\`\`python
# Safe — use parameterized
User.objects.raw("SELECT * FROM auth_user WHERE email=%s", [email])

# Best — use ORM
User.objects.filter(email=email).first()
\`\`\`

### Remediation Steps
1. \`pip install Django==4.2.11\`
2. Replace all raw SQL with parameterized queries
3. Run \`bandit -r . -t B608\` to find remaining issues
4. Add to your CI/CD: \`safety check --full-report\``,
}

function getAIResponse(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('sql') || lower.includes('injection')) return AI_RESPONSES.sql
  if (lower.includes('owasp')) return AI_RESPONSES.owasp
  if (lower.includes('cve-2024') || lower.includes('fix')) return AI_RESPONSES.cve
  return AI_RESPONSES.default
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const [copied, setCopied] = useState(false)
  const isUser = msg.role === 'user'

  const copyContent = () => {
    navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-cyber-600' : 'bg-gradient-to-br from-purple-600 to-cyber-600'
      }`}>
        {isUser ? <span className="text-white text-xs font-bold">U</span> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className={`max-w-[75%] group relative ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed ${
          isUser
            ? 'bg-cyber-600/20 border border-cyber-500/30 text-slate-200'
            : 'bg-dark-700/60 border border-dark-600/50 text-slate-200'
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <ReactMarkdown
              components={{
                code: ({ children, className }) => {
                  const isBlock = className?.includes('language-')
                  return isBlock ? (
                    <pre className="bg-dark-900 rounded-lg p-3 mt-2 mb-2 overflow-x-auto text-xs font-mono">
                      <code>{children}</code>
                    </pre>
                  ) : (
                    <code className="bg-dark-900 px-1.5 py-0.5 rounded text-xs font-mono text-cyber-400">{children}</code>
                  )
                },
                table: ({ children }) => (
                  <div className="overflow-x-auto my-2">
                    <table className="text-xs w-full border-collapse">{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-dark-600 px-3 py-1.5 text-left text-slate-400 bg-dark-800">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="border border-dark-700 px-3 py-1.5 text-slate-300">{children}</td>
                ),
              }}
            >
              {msg.content}
            </ReactMarkdown>
          )}
        </div>
        <button onClick={copyContent}
          className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 bg-dark-700 border border-dark-600 text-slate-400 hover:text-slate-200 p-1 rounded transition-all">
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        </button>
        <span className="text-[10px] text-slate-600 mt-1 px-1">
          {new Date(msg.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </motion.div>
  )
}

export function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'init',
    role: 'assistant',
    content: AI_RESPONSES.default,
    timestamp: new Date().toISOString(),
  }])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = async (text?: string) => {
    const content = text ?? input.trim()
    if (!content) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 500))

    const response = getAIResponse(content)
    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, aiMsg])
    setIsTyping(false)
  }

  return (
    <div className="h-[calc(100vh-9rem)] flex flex-col">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-cyber-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">AI Security Assistant</h1>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse inline-block" />
              Online · Powered by SecureCI Intelligence
            </p>
          </div>
        </div>
        <button onClick={() => setMessages([{ id: 'init', role: 'assistant', content: AI_RESPONSES.default, timestamp: new Date().toISOString() }])}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 bg-dark-800/60 border border-dark-700/50 px-3 py-1.5 rounded-lg transition-all">
          <RefreshCw className="w-3.5 h-3.5" /> Clear
        </button>
      </motion.div>

      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap mb-4 flex-shrink-0">
        {QUICK_ACTIONS.map(a => {
          const Icon = a.icon
          return (
            <button key={a.label} onClick={() => sendMessage(a.prompt)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-dark-800/60 border border-dark-700/50 hover:border-cyber-500/30 px-3 py-1.5 rounded-lg transition-all">
              <Icon className="w-3 h-3" /> {a.label}
            </button>
          )
        })}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 min-h-0">
        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyber-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-dark-700/60 border border-dark-600/50 px-4 py-3 rounded-xl">
              <div className="flex gap-1 items-center">
                {[0, 0.2, 0.4].map(d => (
                  <motion.div key={d} className="w-1.5 h-1.5 bg-cyber-400 rounded-full"
                    animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: d }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0">
        <form onSubmit={e => { e.preventDefault(); sendMessage() }} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about vulnerabilities, security best practices, OWASP, CVEs..."
            className="flex-1 bg-dark-800/80 border border-dark-700/50 text-slate-200 placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyber-500/50 focus:border-cyber-500/50 transition-all"
          />
          <button type="submit" disabled={!input.trim() || isTyping}
            className="bg-gradient-to-r from-cyber-600 to-purple-600 hover:from-cyber-500 hover:to-purple-500 text-white p-3 rounded-xl transition-all shadow-lg hover:shadow-cyber-500/25 disabled:opacity-50 disabled:cursor-not-allowed">
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-slate-600 mt-2 text-center">
          AI responses are for educational purposes. Always verify with official CVE databases and security advisories.
        </p>
      </div>
    </div>
  )
}
