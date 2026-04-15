const BASE_URL = 'http://localhost:3000'; // Make sure backend is running here natively

// Global State Runtime
let COMPANY_ID = document.getElementById('company-id').value;
let APP_STATE = {
    emissions: 0,
    deficit: 0
};

// Elements
const views = document.querySelectorAll('.view');
const navLinks = document.querySelectorAll('.nav-links li');

// View Switching Logic
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        // Toggle active nav styling
        navLinks.forEach(n => n.classList.remove('active'));
        link.classList.add('active');
        
        // Toggle view containers
        const target = link.getAttribute('data-target');
        views.forEach(v => {
            if (v.id === target) v.classList.add('active');
            else v.classList.remove('active');
        });

        // Trigger dynamic pre-fetches
        if (target === 'marketplace-view') loadCredits();
    });
});

document.getElementById('company-id').addEventListener('change', (e) => {
    COMPANY_ID = e.target.value;
    loadDashboard();
});

document.getElementById('refresh-btn').addEventListener('click', loadDashboard);

// 1. Dashboard Controller
async function loadDashboard() {
    try {
        const res = await fetch(`${BASE_URL}/dashboard/${COMPANY_ID}`);
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        
        // Populate KPIs
        document.getElementById('kpi-production').innerHTML = `${Number(data.production).toFixed(2)} <span class="unit">units</span>`;
        document.getElementById('kpi-emissions').innerHTML = `${Number(data.emissions).toFixed(2)} <span class="unit">kwh</span>`;
        document.getElementById('kpi-obligation').innerHTML = `${Number(data.obligation).toFixed(2)} <span class="unit">tons</span>`;
        document.getElementById('kpi-fulfilled').innerHTML = `${Number(data.fulfilled).toFixed(2)} <span class="unit">tons</span>`;
        
        // Compliance Styling Logic
        const statusBox = document.getElementById('status-indicator');
        const statusTxt = document.getElementById('status-text');
        
        statusBox.className = `status-indicator ${data.status}`;
        statusTxt.innerText = data.status === 'compliant' ? 'COMPLIANT ✅' : 'NON-COMPLIANT ❌';
        document.getElementById('deficit-text').innerText = `Deficit: ${Number(data.deficit).toFixed(2)} tons`;

        APP_STATE.emissions = data.emissions;
        APP_STATE.deficit = data.deficit;
    } catch (e) {
        console.error("Dashboard error:", e);
    }
}

// 2. Upload Interceptor
document.getElementById('upload-btn').addEventListener('click', async () => {
    const fileInput = document.getElementById('csv-file');
    const statusMsg = document.getElementById('upload-status');
    if (!fileInput.files[0]) {
        statusMsg.innerText = "Please select a file first.";
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('company_id', COMPANY_ID);

    statusMsg.innerText = "Uploading payload...";

    try {
        const res = await fetch(`${BASE_URL}/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        statusMsg.style.color = "var(--accent)";
        statusMsg.innerText = `Success: Cloud calculations processed correctly.`;
        loadDashboard();
    } catch (e) {
        statusMsg.style.color = "var(--danger)";
        statusMsg.innerText = `Network Error: Backend may be offline. (${e.message})`;
    }
});

// 3. Marketplace Grid Loader
async function loadCredits() {
    const container = document.getElementById('credits-list');
    container.innerHTML = '<p>Loading nodes...</p>';
    
    try {
        const res = await fetch(`${BASE_URL}/credits`);
        const data = await res.json();
        container.innerHTML = '';
        
        if (!data.credits || data.credits.length === 0) {
            container.innerHTML = '<p>No marketplace credits seeded or backend offline.</p>';
            return;
        }

        data.credits.forEach(c => {
            const card = document.createElement('div');
            card.className = 'credit-card glass-panel';
            card.innerHTML = `
                <h3>${c.owner}</h3>
                <div class="credit-details">
                    <p>Standard: <strong>${c.type.toUpperCase()}</strong></p>
                    <p>Volume Available: <strong>${c.quantity} tons</strong></p>
                    <p>Market Value: <strong>₹${c.price}/kg</strong></p>
                    <p>Trust Score: <strong>${c.trust_score}% Reliability</strong></p>
                </div>
                <button class="btn btn-outline" style="border: 1px solid var(--accent); color: var(--accent)" onclick="buyCredit('${c.id}', 10)">Buy 10 Tons Instantly</button>
            `;
            container.appendChild(card);
        });
    } catch(e) {
        container.innerHTML = '<p style="color:var(--danger)">Cannot fetch limits from API.</p>';
    }
}

// 4. Purchasing Request
window.buyCredit = async (credit_id, amount) => {
    try {
        const res = await fetch(`${BASE_URL}/buy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company_id: COMPANY_ID, credit_id, quantity: amount })
        });
        const data = await res.json();
        alert(data.message || data.error);
        loadCredits();
        loadDashboard();
    } catch (e) {
        alert("Transaction dropped. Ensure platform is running locally.");
    }
};

// 5. Google AI Suggestions Link
document.getElementById('fetch-insights-btn').addEventListener('click', async () => {
    const btn = document.getElementById('fetch-insights-btn');
    btn.innerText = "Processing LLM context...";
    
    try {
        const res = await fetch(`${BASE_URL}/ai-insights`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emissions: APP_STATE.emissions, deficit: APP_STATE.deficit })
        });
        
        if(!res.ok) throw new Error("HTTP failure");
        
        const data = await res.json();
        document.getElementById('insight-content').innerHTML = `
            <div class="markdown-body">
                <h3>Gemini AI Inference:</h3>
                <p>${data.insights.replace(/\n/g, '<br/>')}</p>
            </div>
        `;
    } catch (e) {
        document.getElementById('insight-content').innerText = "Pipeline decoupled. Start backend server first.";
    }
    btn.innerText = "Generate Strategic Suggestions";
});

// 6. JSON Compliance Extract
document.getElementById('generate-report').addEventListener('click', async () => {
    try {
        const res = await fetch(`${BASE_URL}/report/${COMPANY_ID}`);
        if (!res.ok) throw new Error("API Err");
        
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data.summary, null, 2)], { type: 'application/json' });
        
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `CarbonOS_Compliance_Extract_${COMPANY_ID}.json`;
        a.click();
    } catch(e) {
        alert("Failed to compile extract from Backend nodes.");
    }
});

// Bootstrapper
loadDashboard();
