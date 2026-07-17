import bcrypt from 'bcryptjs';
import db from './database.js';

console.log('Seeding Ongwaeh Platform database...\n');

db.exec('DELETE FROM activity_log');
db.exec('DELETE FROM notifications');
db.exec('DELETE FROM evidence');
db.exec('DELETE FROM vulnerabilities');
db.exec('DELETE FROM notes');
db.exec('DELETE FROM reports');
db.exec('DELETE FROM engagement_testers');
db.exec('DELETE FROM engagements');
db.exec('DELETE FROM targets');
db.exec('DELETE FROM users');

const passwordHash = bcrypt.hashSync('password123', 10);

const users = [
  { username: 'admin', email: 'admin@ongwaeh.com', full_name: 'System Admin', role: 'admin' },
  { username: 'sarah.chen', email: 'sarah@ongwaeh.com', full_name: 'Sarah Chen', role: 'manager' },
  { username: 'john.pentest', email: 'john@ongwaeh.com', full_name: 'John Rodriguez', role: 'tester' },
  { username: 'mike.scan', email: 'mike@ongwaeh.com', full_name: 'Mike Thompson', role: 'tester' },
  { username: 'brian.ongwaeh', email: 'brian@ongwaeh.com', full_name: 'Brian Ongwaeh', role: 'tester' },
  { username: 'lisa.audit', email: 'lisa@ongwaeh.com', full_name: 'Lisa Park', role: 'viewer' },
];

const insertUser = db.prepare('INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)');
const userIds = {};
for (const u of users) {
  const result = insertUser.run(u.username, u.email, passwordHash, u.full_name, u.role);
  userIds[u.username] = result.lastInsertRowid;
}
console.log(`Created ${users.length} users`);

const targets = [
  { name: 'Acme Corp Web App', type: 'url', address: 'https://app.acme-corp.com', port_range: '443', os_info: 'Linux/nginx', description: 'Main production web application', tags: '["web","production","critical"]' },
  { name: 'Acme Corp API', type: 'url', address: 'https://api.acme-corp.com', port_range: '443', os_info: 'Linux/Docker', description: 'REST API backend services', tags: '["api","production"]' },
  { name: 'DMZ Mail Server', type: 'ip', address: '203.0.113.10', port_range: '25,110,143,993', os_info: 'Ubuntu 22.04', description: 'Email server in DMZ', tags: '["mail","dmz"]' },
  { name: 'Dev Staging Server', type: 'ip', address: '192.168.1.50', port_range: '22,80,443,3000,5432', os_info: 'Debian 12', description: 'Development staging environment', tags: '["dev","internal","staging"]' },
  { name: 'Internal Wiki', type: 'domain', address: 'wiki.acme-corp.internal', port_range: '443,8443', os_info: 'CentOS 8', description: 'Internal knowledge base', tags: '["wiki","internal"]' },
  { name: 'Cloud Storage Bucket', type: 'url', address: 'https://acme-corp-storage.s3.amazonaws.com', port_range: '443', os_info: 'AWS S3', description: 'Public-facing S3 bucket', tags: '["cloud","storage","aws"]' },
  { name: 'VPN Gateway', type: 'ip', address: '198.51.100.1', port_range: '500,4500,1194', os_info: 'pfSense', description: 'Primary VPN concentrator', tags: '["vpn","network"]' },
];

const insertTarget = db.prepare('INSERT INTO targets (name, type, address, port_range, os_info, description, tags, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
const targetIds = {};
for (const t of targets) {
  const result = insertTarget.run(t.name, t.type, t.address, t.port_range, t.os_info, t.description, t.tags, userIds['sarah.chen']);
  targetIds[t.name] = result.lastInsertRowid;
}
console.log(`Created ${targets.length} targets`);

const engagements = [
  { name: 'Q4 2024 External Pentest - Acme Web App', target: 'Acme Corp Web App', status: 'completed', test_type: 'black_box', scope: 'Full external penetration test of the production web application including authentication, authorization, input validation, and API endpoints.', objectives: 'Identify critical vulnerabilities that could lead to data breach or unauthorized access.', start_date: '2024-10-01', end_date: '2024-10-15', testers: ['john.pentest', 'mike.scan'] },
  { name: 'API Security Assessment', target: 'Acme Corp API', status: 'active', test_type: 'gray_box', scope: 'API security testing with developer credentials. Focus on OWASP API Security Top 10.', objectives: 'Validate API authentication, rate limiting, data validation, and business logic flaws.', start_date: '2024-11-01', end_date: null, testers: ['john.pentest'] },
  { name: 'DMZ Infrastructure Pentest', target: 'DMZ Mail Server', status: 'active', test_type: 'white_box', scope: 'Full infrastructure assessment of DMZ mail server including service enumeration, vulnerability scanning, and manual exploitation attempts.', objectives: 'Assess mail server configuration, identify outdated software, test for known CVEs.', start_date: '2024-11-10', end_date: null, testers: ['mike.scan'] },
  { name: 'Staging Environment Pentest', target: 'Dev Staging Server', status: 'planned', test_type: 'gray_box', scope: 'Internal network penetration test focusing on the development staging environment.', objectives: 'Test lateral movement possibilities and assess development environment security.', start_date: '2024-12-01', end_date: null, testers: ['john.pentest', 'mike.scan'] },
  { name: 'Red Team Exercise - Full Scope', target: 'Acme Corp Web App', status: 'planned', test_type: 'red_team', scope: 'Full-scope red team engagement targeting the entire organization perimeteter.', objectives: 'Simulate advanced persistent threat scenario. Test detection and response capabilities.', start_date: '2025-01-15', end_date: null, testers: ['john.pentest'] },
];

const insertEng = db.prepare('INSERT INTO engagements (name, target_id, status, test_type, scope, objectives, start_date, end_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
const insertTester = db.prepare('INSERT INTO engagement_testers (engagement_id, user_id) VALUES (?, ?)');
const engIds = {};
for (const e of engagements) {
  const result = insertEng.run(e.name, targetIds[e.target], e.status, e.test_type, e.scope, e.objectives, e.start_date, e.end_date, userIds['sarah.chen']);
  engIds[e.name] = result.lastInsertRowid;
  for (const t of e.testers) {
    insertTester.run(engIds[e.name], userIds[t]);
  }
}
console.log(`Created ${engagements.length} engagements`);

const vulns = [
  { eng: 'Q4 2024 External Pentest - Acme Web App', target: 'Acme Corp Web App', title: 'SQL Injection in Login Form', severity: 'critical', cvss: 9.8, cwe: 'CWE-89', owasp: 'A03:2021 - Injection', description: 'The login form is vulnerable to SQL injection via the username parameter. An attacker can bypass authentication or extract sensitive data from the database.', impact: 'Complete database compromise, authentication bypass, potential for remote code execution.', remediation: 'Use parameterized queries/prepared statements. Implement input validation and WAF rules.', status: 'resolved', found_by: 'john.pentest' },
  { eng: 'Q4 2024 External Pentest - Acme Web App', target: 'Acme Corp Web App', title: 'Stored XSS in User Profile', severity: 'high', cvss: 7.5, cwe: 'CWE-79', owasp: 'A03:2021 - Injection', description: 'Cross-site scripting vulnerability in the user profile bio field. Script content is rendered without sanitization when other users view the profile.', impact: 'Session hijacking, credential theft, defacement, malicious redirects.', remediation: 'Implement context-aware output encoding. Use Content Security Policy headers.', status: 'confirmed', found_by: 'john.pentest' },
  { eng: 'Q4 2024 External Pentest - Acme Web App', target: 'Acme Corp Web App', title: 'Insecure Direct Object Reference - IDOR', severity: 'high', cvss: 7.1, cwe: 'CWE-639', owasp: 'A01:2021 - Broken Access Control', description: 'User profiles can be accessed by incrementing the user ID in the API endpoint /api/users/{id} without proper authorization checks.', impact: 'Unauthorized access to user PII, account takeover potential.', remediation: 'Implement proper authorization checks. Use UUIDs instead of sequential IDs.', status: 'in_progress', found_by: 'mike.scan' },
  { eng: 'Q4 2024 External Pentest - Acme Web App', target: 'Acme Corp Web App', title: 'Missing Rate Limiting on Login', severity: 'medium', cvss: 5.3, cwe: 'CWE-307', owasp: 'A07:2021 - Identification and Authentication Failures', description: 'The login endpoint has no rate limiting, allowing unlimited brute-force attempts.', impact: 'Credential brute-forcing, account compromise.', remediation: 'Implement rate limiting, account lockout, and CAPTCHA after failed attempts.', status: 'open', found_by: 'john.pentest' },
  { eng: 'Q4 2024 External Pentest - Acme Web App', target: 'Acme Corp Web App', title: 'Server Version Disclosure', severity: 'info', cvss: 0, cwe: 'CWE-200', owasp: 'A05:2021 - Security Misconfiguration', description: 'Server header reveals nginx version and OS information.', impact: 'Information disclosure that aids reconnaissance.', remediation: 'Remove or obfuscate server version headers.', status: 'open', found_by: 'mike.scan' },
  { eng: 'Q4 2024 External Pentest - Acme Web App', target: 'Acme Corp Web App', title: 'Weak Password Policy', severity: 'medium', cvss: 5.3, cwe: 'CWE-521', owasp: 'A07:2021 - Identification and Authentication Failures', description: 'The registration form accepts weak passwords (minimum 6 characters, no complexity requirements).', impact: 'Accounts easily compromised via brute force or credential stuffing.', remediation: 'Enforce minimum 12 characters with complexity requirements. Implement breach password checking.', status: 'open', found_by: 'john.pentest' },
  { eng: 'API Security Assessment', target: 'Acme Corp API', title: 'Mass Assignment Vulnerability', severity: 'high', cvss: 7.2, cwe: 'CWE-915', owasp: 'API1:2023 - Broken Object Level Authorization', description: 'API accepts additional fields during user registration allowing privilege escalation by setting role=admin.', impact: 'Privilege escalation to admin, unauthorized access to all API resources.', remediation: 'Implement allow-listing for writable fields. Use DTOs for input validation.', status: 'open', found_by: 'john.pentest' },
  { eng: 'API Security Assessment', target: 'Acme Corp API', title: 'Excessive Data Exposure in API Response', severity: 'medium', cvss: 5.3, cwe: 'CWE-200', owasp: 'API6:2023 - Unrestricted Access to Sensitive Business Flows', description: 'The /api/users endpoint returns password hashes, internal IDs, and other sensitive fields to authenticated users.', impact: 'Information disclosure of sensitive internal data.', remediation: 'Implement response filtering. Use field selection or DTOs to control API responses.', status: 'confirmed', found_by: 'john.pentest' },
  { eng: 'API Security Assessment', target: 'Acme Corp API', title: 'Missing API Authentication on /api/v2/beta', severity: 'critical', cvss: 9.1, cwe: 'CWE-306', owasp: 'API2:2023 - Broken Authentication', description: 'The beta API v2 endpoints are accessible without any authentication token.', impact: 'Unauthenticated access to pre-release features, potential data exposure.', remediation: 'Apply authentication middleware to all API routes including beta versions.', status: 'open', found_by: 'john.pentest' },
  { eng: 'DMZ Infrastructure Pentest', target: 'DMZ Mail Server', title: 'Outdated OpenSSL Version - CVE-2024-0727', severity: 'high', cvss: 7.5, cwe: 'CWE-1395', owasp: '', description: 'Mail server is running OpenSSL 1.1.1 which has reached end-of-life and contains multiple known vulnerabilities.', impact: 'Potential exploitation of known cryptographic vulnerabilities.', remediation: 'Upgrade to OpenSSL 3.x latest stable release.', status: 'in_progress', found_by: 'mike.scan' },
  { eng: 'DMZ Infrastructure Pentest', target: 'DMZ Mail Server', title: 'Open Relay Configuration', severity: 'medium', cvss: 5.3, cwe: 'CWE-778', owasp: 'A05:2021 - Security Misconfiguration', description: 'SMTP server is configured as an open relay allowing unauthenticated email forwarding.', impact: 'Can be abused for phishing campaigns and spam, damaging organization reputation.', remediation: 'Configure SMTP authentication requirements. Restrict relay to authorized networks.', status: 'open', found_by: 'mike.scan' },
  { eng: 'DMZ Infrastructure Pentest', target: 'DMZ Mail Server', title: 'Weak TLS Configuration', severity: 'medium', cvss: 4.3, cwe: 'CWE-326', owasp: 'A02:2021 - Cryptographic Failures', description: 'SMTP server accepts TLS 1.0 and TLS 1.1 connections. Supports weak cipher suites.', impact: 'Email communications vulnerable to interception via downgrade attacks.', remediation: 'Disable TLS 1.0/1.1. Configure strong cipher suites only. Enable TLS 1.3.', status: 'open', found_by: 'mike.scan' },
];

const insertVuln = db.prepare(
  'INSERT INTO vulnerabilities (engagement_id, target_id, title, severity, cvss_score, cwe_id, owasp_category, description, impact, remediation, status, found_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
const vulnIds = {};
for (const v of vulns) {
  const result = insertVuln.run(engIds[v.eng], targetIds[v.target], v.title, v.severity, v.cvss, v.cwe, v.owasp, v.description, v.impact, v.remediation, v.status, userIds[v.found_by]);
  vulnIds[v.title] = result.lastInsertRowid;
}
console.log(`Created ${vulns.length} vulnerabilities`);

const notes = [
  { eng: 'Q4 2024 External Pentest - Acme Web App', user: 'john.pentest', title: 'Reconnaissance Findings', content: 'During initial recon, identified the following:\n- Cloudflare WAF in front of the application\n- Three subdomains: app, api, admin\n- Admin subdomain returns 403 but reveals technology stack\n- JavaScript bundle contains API keys for development environment', is_private: 0 },
  { eng: 'Q4 2024 External Pentest - Acme Web App', user: 'mike.scan', title: 'WAF Bypass Notes', content: 'Found that the Cloudflare WAF can be bypassed using:\n- Unicode normalization attacks\n- Double URL encoding on certain payloads\n- HTTP/2 request smuggling\n\nDocumented bypass techniques in the evidence folder.', is_private: 1 },
  { eng: 'API Security Assessment', user: 'john.pentest', title: 'API Endpoint Discovery', content: 'Discovered endpoints through JavaScript analysis and fuzzing:\n- /api/v1/users, /api/v1/products, /api/v1/orders\n- /api/v2/beta/* (no auth required!)\n- /api/internal/debug (accessible without auth)\n- GraphQL endpoint at /api/graphql', is_private: 0 },
];

const insertNote = db.prepare('INSERT INTO notes (engagement_id, user_id, title, content, is_private) VALUES (?, ?, ?, ?, ?)');
for (const n of notes) {
  insertNote.run(engIds[n.eng], userIds[n.user], n.title, n.content, n.is_private ? 1 : 0);
}
console.log(`Created ${notes.length} notes`);

const reports = [
  { eng: 'Q4 2024 External Pentest - Acme Web App', title: 'Q4 2024 External Pentest - Full Report', type: 'full', generated_by: 'sarah.chen' },
  { eng: 'Q4 2024 External Pentest - Acme Web App', title: 'Executive Summary - Acme Web App', type: 'executive', generated_by: 'sarah.chen' },
];

const insertReport = db.prepare('INSERT INTO reports (engagement_id, title, report_type, content, generated_by) VALUES (?, ?, ?, ?, ?)');
for (const r of reports) {
  const vulnCount = db.prepare('SELECT COUNT(*) as count FROM vulnerabilities WHERE engagement_id = ?').get(engIds[r.eng]);
  insertReport.run(engIds[r.eng], r.title, r.type, JSON.stringify({ generated: true, total_vulns: vulnCount.count }), userIds[r.generated_by]);
}
console.log(`Created ${reports.length} reports`);

const notifications = [
  { user: 'sarah.chen', title: 'New Critical Vulnerability', message: 'SQL Injection found in Acme Web App login form', type: 'critical', link: `/vulnerabilities/${vulnIds['SQL Injection in Login Form']}` },
  { user: 'sarah.chen', title: 'Engagement Completed', message: 'Q4 2024 External Pentest has been marked as completed', type: 'success', link: `/engagements/${engIds['Q4 2024 External Pentest - Acme Web App']}` },
  { user: 'john.pentest', title: 'New Engagement Assigned', message: 'You have been assigned to API Security Assessment', type: 'info', link: `/engagements/${engIds['API Security Assessment']}` },
  { user: 'mike.scan', title: 'New Engagement Assigned', message: 'You have been assigned to DMZ Infrastructure Pentest', type: 'info', link: `/engagements/${engIds['DMZ Infrastructure Pentest']}` },
];

const insertNotif = db.prepare('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)');
for (const n of notifications) {
  insertNotif.run(userIds[n.user], n.title, n.message, n.type, n.link);
}
console.log(`Created ${notifications.length} notifications`);

console.log('\nSeed completed successfully!');
console.log('\nLogin credentials:');
console.log('  Admin:    admin / password123');
console.log('  Manager:  sarah.chen / password123');
console.log('  Tester 1: john.pentest / password123');
console.log('  Tester 2: mike.scan / password123');
console.log('  Tester 3: brian.ongwaeh / password123');
console.log('  Viewer:   lisa.audit / password123');
