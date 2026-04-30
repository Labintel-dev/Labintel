const fs = require('fs');

let c = fs.readFileSync('backend/templates/report.html', 'utf8');

c = c.replace(/    \.patient-summary \{[\s\S]*?white-space: pre-wrap;\r?\n    \}\r?\n\r?\n?/g, '');
c = c.replace(/      <div class="patient-summary">\r?\n        <div class="patient-summary-title">Simple AI Summary For Patient Understanding<\/div>\r?\n        <div class="patient-summary-text">\{\{PATIENT_AI_SUMMARY\}\}<\/div>\r?\n      <\/div>\r?\n\r?\n?/g, '');

fs.writeFileSync('backend/templates/report.html', c);
console.log('Fixed backend/templates/report.html');
