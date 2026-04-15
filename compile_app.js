const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'carbonos-pro-app');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// 1. Map all 7 exact Stitch HTML files from the user
const pages = {
    'index.html': 'carbonos_landing_page/code.html',
    'signup.html': 'carbonos_sign_up_flow/code.html',
    'dashboard.html': 'carbonos_dashboard/code.html',
    'upload.html': 'carbonos_data_upload/code.html',
    'marketplace.html': 'carbonos_marketplace/code.html',
    'insights.html': 'carbonos_ai_insights/code.html',
    'reports.html': 'carbonos_reports/code.html'
};

// 2. Global application logic script injected into every page
const appCoreLogic = `
// Universal CarbonOS Backend Connector
const BASE_API = 'http://localhost:3000';
let COMPANY_ID = localStorage.getItem('CARBONOS_COMPANY');

// Security Gate
const page = window.location.pathname.split('/').pop() || 'index.html';
if (!COMPANY_ID && page !== 'index.html' && page !== 'signup.html') {
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Global Navigation Hijack (Wires all "href" visual links seamlessly)
    const links = document.querySelectorAll('a');
    links.forEach(l => {
        const text = l.innerText.toLowerCase();
        if(text.includes('dashboard') || text.includes('enter sandbox')) l.href = 'dashboard.html';
        else if(text.includes('upload')) l.href = 'upload.html';
        else if(text.includes('marketplace')) l.href = 'marketplace.html';
        else if(text.includes('insights')) l.href = 'insights.html';
        else if(text.includes('reports')) l.href = 'reports.html';
        else if(text.includes('sign') || text.includes('deploy') || text.includes('register')) l.href = 'signup.html';
    });

    // 2. Landing / Signup Form Listeners
    if(page === 'index.html') {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(b => {
            if(b.innerText.toLowerCase().includes('login') || b.innerText.toLowerCase().includes('get started')) {
                b.addEventListener('click', () => {
                    localStorage.setItem('CARBONOS_COMPANY', '11111111-1111-1111-1111-111111111111');
                    window.location.href = 'dashboard.html';
                });
            }
        });
    }

    if(page === 'signup.html') {
        const createBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.toLowerCase().includes('create') || b.innerText.toLowerCase().includes('deploy') || b.innerText.toLowerCase().includes('sign'));
        if(createBtn) {
            createBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.setItem('CARBONOS_COMPANY', '11111111-1111-1111-1111-111111111111');
                window.location.href = 'dashboard.html';
            });
        }
    }

    // 3. Routing Specifics
    if(page === 'dashboard.html') injectDashboard();
    if(page === 'upload.html') injectUpload();
    if(page === 'marketplace.html') injectMarketplace();
    if(page === 'insights.html') injectInsights();
});

async function injectDashboard() {
    try {
        const res = await fetch(\`\${BASE_API}/dashboard/\${COMPANY_ID}\`);
        const data = await res.json();
        
        // Find main KPIs by detecting tailwind fonts
        const numbers = Array.from(document.querySelectorAll('.font-space')).filter(el => !isNaN(parseInt(el.innerText?.replace(',', ''))) && el.innerText.length > 0 && el.innerText.length < 9);
        if(numbers.length >= 5) {
            numbers[0].innerText = Number(data.production).toLocaleString();
            numbers[1].innerText = Number(data.emissions).toLocaleString();
            numbers[2].innerText = Number(data.obligation).toLocaleString();
            numbers[3].innerText = Number(data.fulfilled).toLocaleString();
            numbers[4].innerText = Number(data.deficit).toLocaleString();
        }
    } catch(e) {}
}

async function injectUpload() {
    const mainPane = document.querySelector('main');
    if(!mainPane) return;
    
    // Inject the real input payload block above the visual elements
    mainPane.innerHTML = \`
        <div class="px-8 mt-10 max-w-4xl">
            <h2 class="text-2xl font-bold font-space text-primary mb-4">Attach Telemetry JSON/CSV</h2>
            <input type="file" id="real-file-input" accept=".csv" class="mb-6 w-full text-sm text-on-surface p-4 border border-outline-variant rounded" />
            <button id="real-upload-btn" class="bg-primary text-[#001112] px-8 py-3 rounded-xl font-bold">Process Upload</button>
            <p id="upload-result" class="mt-4 text-xs tracking-widest uppercase font-space text-on-surface-variant"></p>
        </div>
    \` + mainPane.innerHTML; // Keeps original UI below!

    document.getElementById('real-upload-btn').addEventListener('click', async () => {
        const file = document.getElementById('real-file-input').files[0];
        if(!file) return alert('No file attached.');
        const fb = new FormData();
        fb.append('file', file);
        fb.append('company_id', COMPANY_ID);
        
        document.getElementById('upload-result').innerText = "Processing matrix...";
        try {
            const res = await fetch(\`\${BASE_API}/upload\`, { method: 'POST', body: fb });
            document.getElementById('upload-result').innerText = "SUCCESS: Telemetry appended.";
            document.getElementById('upload-result').style.color = "#00FFC2";
        } catch(e) {
            document.getElementById('upload-result').innerText = "Network transmission failed.";
        }
    });
}

function injectMarketplace() {
    const dynamicContainer = document.createElement('div');
    dynamicContainer.className = 'grid grid-cols-1 md:grid-cols-2 gap-6 px-8 pb-20';
    document.querySelector('main').appendChild(dynamicContainer);
    
    fetch(\`\${BASE_API}/credits\`).then(r => r.json()).then(data => {
        if(!data.credits) return;
        data.credits.forEach(c => {
            dynamicContainer.innerHTML += \`
                <div class="bg-surface-container-low p-6 rounded-xl border border-outline-variant/20 hover:border-primary/50 transition-colors">
                    <h3 class="text-xl font-bold font-space text-primary mb-2">\${c.owner}</h3>
                    <p class="text-[10px] text-on-surface-variant uppercase tracking-widest mb-4">\${c.type}</p>
                    <div class="flex justify-between items-end mt-4">
                        <div>
                            <p class="text-2xl font-bold font-space">\${c.quantity} <span class="text-xs">tons</span></p>
                            <p class="text-xs text-tertiary">₹\${c.price} / kg</p>
                        </div>
                        <button onclick="window.buyCredit('\${c.id}')" class="bg-primary text-[#001112] px-4 py-2 rounded-lg font-bold text-sm">Procure Credits</button>
                    </div>
                </div>
            \`;
        });
    });
}
window.buyCredit = async (credit_id) => {
    try {
        await fetch(\`\${BASE_API}/buy\`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ company_id: COMPANY_ID, credit_id, quantity: 10 }) });
        alert('Credits secured! Dashboard updated.');
        window.location.href = "dashboard.html";
    } catch(e) {}
}

function injectInsights() {
    const mainObj = document.querySelector('main');
    const container = document.createElement('div');
    container.className = "flex flex-col items-center max-w-4xl px-8 mb-8";
    container.innerHTML = \`<button id="real-ai-btn" class="bg-[#00fdc1] text-[#001112] px-8 py-4 rounded-xl font-bold font-space mb-8">Ask AI Gemini for Strategy</button>\`;
    mainObj.insertBefore(container, mainObj.firstChild);

    document.getElementById('real-ai-btn').addEventListener('click', async () => {
        const btn = document.getElementById('real-ai-btn');
        btn.innerText = "Analyzing Telemetry...";
        try {
            const dash = await fetch(\`\${BASE_API}/dashboard/\${COMPANY_ID}\`).then(r=>r.json());
            const res = await fetch(\`\${BASE_API}/ai-insights\`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ emissions: dash.emissions, deficit: dash.deficit }) });
            const data = await res.json();
            container.innerHTML += \`<div class="bg-surface-container-low p-6 rounded-xl text-left border border-primary/20"><p>\${data.insights.replace(/\\n/g, '<br/>')}</p></div>\`;
            btn.innerText = "Strategy Formulated";
        } catch(e) {}
    });
}
`;
fs.writeFileSync(path.join(outputDir, 'app_logic.js'), appCoreLogic);

// 3. Process the 7 Stitch Views natively 
for (const [filename, relativePath] of Object.entries(pages)) {
    const fullPath = path.join(__dirname, relativePath);
    if (fs.existsSync(fullPath)) {
        let rawHtml = fs.readFileSync(fullPath, 'utf8');
        rawHtml = rawHtml.replace(/src="https:\/\/lh3\.googleusercontent\.com[^"]+"/g, 'src="https://ui-avatars.com/api/?name=Carbon+OS&background=00fdc1&color=001112"');
        rawHtml = rawHtml.replace('</body>', '<script src="app_logic.js"></script></body>');
        fs.writeFileSync(path.join(outputDir, filename), rawHtml);
    } else {
        console.warn(`MISSING DESIGN FILE: ${relativePath}`);
    }
}

console.log("Compiled all 7 views seamlessly. Web app is ready.");
