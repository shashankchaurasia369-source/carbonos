const COMPANY_ID = "automated-tester-999";
const BASE = "http://localhost:3000";

async function runCoreTests() {
    console.log("--- CarbonOS Flow Simulation ---");
    
    // 1. Upload Mock Production Payload
    console.log("1. Simulating Data Upload via JSON payload...");
    const uploadRes = await fetch(`${BASE}/upload`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ company_id: COMPANY_ID, data: [ {production_tons: 2000, energy_kwh: 5000, category: 'testing'} ] })
    }).then(r => r.json());
    console.log(` > Upload Success! Obligation Created: ${uploadRes.obligation} tons`);

    // 2. Dashboard KPIs
    console.log("\n2. Checking the Realtime Dashboard...");
    const dashInfo = await fetch(`${BASE}/dashboard/${COMPANY_ID}`).then(r => r.json());
    console.log(` > Current Carbon Status: ${dashInfo.status} (Deficit: ${dashInfo.deficit} tons)`);

    // 3. Load Marketplace
    console.log("\n3. Loading Marketplace APIs...");
    const marketplace = await fetch(`${BASE}/credits`).then(r => r.json());
    const targetCredit = marketplace.credits[0];
    console.log(` > Found Credits! Targeting '${targetCredit.owner}' with ID: ${targetCredit.id}`);

    // 4. Buy Credit Transaction
    console.log("\n4. Executing Purchase of 100 Tons...");
    await fetch(`${BASE}/buy`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ company_id: COMPANY_ID, credit_id: targetCredit.id, quantity: 100 })
    }).then(r => r.json());

    // 5. Final Dashboard Check
    console.log("\n5. Verifying Obligation Fulfilled...");
    const updatedDash = await fetch(`${BASE}/dashboard/${COMPANY_ID}`).then(r => r.json());
    console.log(` > Updated Fulfilled: ${updatedDash.fulfilled} tons`);
    console.log(` > Remaining Deficit: ${updatedDash.deficit} tons`);
}

runCoreTests();
