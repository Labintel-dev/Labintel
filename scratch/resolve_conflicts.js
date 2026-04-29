const fs = require('fs');
const path = require('path');

function resolveConflictsInFile(filePath) {
    console.log(`Processing ${filePath}...`);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    const resolvedLines = [];
    let inConflict = false;
    let keepLines = true; // By default we keep lines

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('<<<<<<< HEAD')) {
            inConflict = true;
            keepLines = true; // Keep the HEAD section
            continue;
        } else if (line.startsWith('=======')) {
            keepLines = false; // Skip the other section
            continue;
        } else if (line.startsWith('>>>>>>>')) {
            inConflict = false;
            keepLines = true; // Back to normal
            continue;
        }

        if (keepLines) {
            resolvedLines.push(line);
        }
    }

    fs.writeFileSync(filePath, resolvedLines.join('\n'), 'utf8');
}

const filesToFix = [
    'server/utils/geminiService.js',
    'server/server.js',
    'server/package.json',
    'server/list_models.js',
    'server/diagnose_models.js',
    'client/src/services/apiClient.js',
    'client/src/pages/LandingPage.jsx',
    'client/src/pages/Dashboards.jsx',
    'client/src/lib/supabase.js',
    'client/src/index.css',
    'client/src/components/OCRScanningWorkspace.jsx',
    'client/src/components/MedicalReportView.jsx',
    'client/src/components/AIEngine.jsx',
    'client/src/App.css'
];

filesToFix.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
        resolveConflictsInFile(fullPath);
    } else {
        console.warn(`File not found: ${fullPath}`);
    }
});

console.log('Done resolving conflicts!');
