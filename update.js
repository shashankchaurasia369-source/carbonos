const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'stitch_carbonos_enterprise_dashboard');
const destDir = path.join(__dirname, 'carbonos-pro-app');

const files = {
    'carbonos_dashboard_2': 'dashboard.html',
    'carbonos_marketplace_2': 'marketplace.html',
    'carbonos_reports_2': 'reports.html',
    'carbonos_sign_up_flow_2': 'signup.html',
    'carbonos_data_upload_2': 'upload.html',
    'carbonos_ai_insights_2': 'insights.html'
};

for (const [folder, target] of Object.entries(files)) {
    const srcFile = path.join(srcDir, folder, 'code.html');
    const destFile = path.join(destDir, target);
    if (fs.existsSync(srcFile)) {
        let content = fs.readFileSync(srcFile, 'utf8');
        
        if (!content.includes('app_logic.js')) {
            content = content.replace('</body>', '<script src="app_logic.js"></script></body>');
        }
        
        fs.writeFileSync(destFile, content);
        console.log("Updated", target);
    } else {
        console.error("Missing", srcFile);
    }
}
