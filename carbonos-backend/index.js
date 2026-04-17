const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const os = require('os');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: os.tmpdir() });

// ==========================================
// API 0: GET / (Health Check for Deployments)
// ==========================================
app.get('/', (req, res) => {
    res.json({ status: 'active', message: 'CarbonOS API is running safely!' });
});

// Initialize Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'mock-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Google Generative AI Configuration
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || 'mock-key');

// Helper function to calculate deficit and status
const calculateStatus = (obligation, fulfilled) => {
    const deficit = obligation - fulfilled;
    return {
        deficit: deficit,
        status: deficit > 0 ? 'non-compliant' : 'compliant'
    };
};

// ==========================================
// API -1: POST /signup
// ==========================================
app.post('/signup', async (req, res) => {
    try {
        const { name, type } = req.body;
        if (!name) return res.status(400).json({ error: 'Company name is required' });

        const { data, error } = await supabase.from('companies').insert({ 
            name: name,
            type: type || 'manufacturer'
        }).select().single();

        if (error) throw error;

        // Initialize empty rows for the new company to avoid null checks later
        await supabase.from('emissions').insert({ company_id: data.id, emissions_value: 0 });
        await supabase.from('obligations').insert({ 
            company_id: data.id, 
            total: 0, 
            fulfilled: 0, 
            deficit: 0, 
            status: 'compliant' 
        });

        res.json({ message: 'Company registered successfully', company: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// API 1: POST /upload
// ==========================================
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const { company_id } = req.body;
        if (!company_id) return res.status(400).json({ error: 'company_id is required' });

        const results = [];
        
        // Handle CSV
        if (req.file) {
            fs.createReadStream(req.file.path)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                    await processUploadData(company_id, results, res, req.file.path);
                });
        } else if (req.body.data) {
            // Handle JSON directly passed in body
            await processUploadData(company_id, req.body.data, res, null);
        } else {
            return res.status(400).json({ error: 'Provide file or JSON data array' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

async function processUploadData(company_id, data, res, filePath) {
    if (filePath) fs.unlinkSync(filePath); // clean up temp file
    
    // Compute total production and energy
    let totalProductionTons = 0;
    let totalEnergyKwh = 0;
    
    // Arrays for bulk insert would be more efficient, simplified here for context
    const productionRecords = [];

    for (const item of data) {
        const prod = parseFloat(item.production_tons || 0);
        const energy = parseFloat(item.energy_kwh || 0);
        
        totalProductionTons += prod;
        totalEnergyKwh += energy;
        
        productionRecords.push({
            company_id,
            production_tons: prod,
            energy_kwh: energy,
            category: item.category || 'general'
        });
    }

    // Save production data to Supabase
    const { error: prodError } = await supabase.from('production_data').insert(productionRecords);
    if (prodError) console.error("Error inserting production data:", prodError);

    // Business Logic Rules: 
    // EPR: obligation = production_tons * 0.7
    // Carbon: emissions = energy_kwh * 0.82
    const obligationTons = totalProductionTons * 0.7;
    const emissionsValue = totalEnergyKwh * 0.82;

    // --- Update Emissions table ---
    let { data: existingEmission } = await supabase.from('emissions').select('*').eq('company_id', company_id).single();
    if (existingEmission) {
        await supabase.from('emissions').update({
            emissions_value: existingEmission.emissions_value + emissionsValue
        }).eq('company_id', company_id);
    } else {
        await supabase.from('emissions').insert({ company_id, emissions_value: emissionsValue });
    }

    // --- Update Obligations table ---
    let { data: existingObligation } = await supabase.from('obligations').select('*').eq('company_id', company_id).single();
    if (existingObligation) {
        const newTotal = existingObligation.total + obligationTons;
        const fulfilled = existingObligation.fulfilled;
        const { deficit, status } = calculateStatus(newTotal, fulfilled);
        
        await supabase.from('obligations').update({ 
            total: newTotal, deficit, status 
        }).eq('company_id', company_id);
    } else {
        const { deficit, status } = calculateStatus(obligationTons, 0);
        await supabase.from('obligations').insert({
            company_id, 
            total: obligationTons, 
            fulfilled: 0, 
            deficit, 
            status
        });
    }

    res.json({ 
        message: 'Data uploaded and processed correctly', 
        obligation: obligationTons, 
        emissions: emissionsValue 
    });
}

// ==========================================
// API 2: GET /dashboard/:company_id
// ==========================================
app.get('/dashboard/:company_id', async (req, res) => {
    const { company_id } = req.params;
    
    // Calculate total production from the production details
    const { data: productionData } = await supabase.from('production_data').select('production_tons').eq('company_id', company_id);
    const totalProduction = productionData ? productionData.reduce((acc, curr) => acc + parseFloat(curr.production_tons), 0) : 0;
    
    const { data: emissionsData } = await supabase.from('emissions').select('emissions_value').eq('company_id', company_id).single();
    const { data: obligationData } = await supabase.from('obligations').select('*').eq('company_id', company_id).single();
    
    res.json({
        production: totalProduction,
        emissions: emissionsData ? emissionsData.emissions_value : 0,
        obligation: obligationData ? obligationData.total : 0,
        fulfilled: obligationData ? obligationData.fulfilled : 0,
        deficit: obligationData ? obligationData.deficit : 0,
        status: obligationData ? obligationData.status : 'compliant',
    });
});

// ==========================================
// API 3: GET /credits
// ==========================================
app.get('/credits', async (req, res) => {
    try {
        let { data: credits, error } = await supabase.from('credits').select('*');
        if (error) throw error;
        
        // Seed functionality as per rules
        if (!credits || credits.length === 0) {
            const mockCredits = [
                { type: 'eprr_plastic', quantity: 500, price: 10, owner: 'Recycler A', trust_score: 95, status: 'available' },
                { type: 'eprr_e_waste', quantity: 300, price: 12, owner: 'Recycler B', trust_score: 90, status: 'available' }
            ];
            
            await supabase.from('credits').insert(mockCredits);
            const freshData = await supabase.from('credits').select('*');
            credits = freshData.data;
        }

        res.json({ credits });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// API 4: POST /buy
// ==========================================
app.post('/buy', async (req, res) => {
    const { company_id, credit_id, quantity } = req.body;
    
    if (!company_id || !credit_id || !quantity) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    // Check credit availability
    const { data: credit } = await supabase.from('credits').select('*').eq('id', credit_id).single();
    
    if (!credit) return res.status(404).json({ error: 'Credit not found' });
    if (credit.quantity < quantity) {
        return res.status(400).json({ error: `Insufficient credit. Available: ${credit.quantity}` });
    }
    
    // 1. Reduce credit quantity
    const remaining_quantity = credit.quantity - quantity;
    await supabase.from('credits').update({
        quantity: remaining_quantity,
        status: remaining_quantity === 0 ? 'sold' : 'available'
    }).eq('id', credit_id);
    
    // 2. update obligations.fulfilled & update deficit
    const { data: obligation } = await supabase.from('obligations').select('*').eq('company_id', company_id).single();
    
    if (obligation) {
        const newFulfilled = obligation.fulfilled + quantity;
        const { deficit, status } = calculateStatus(obligation.total, newFulfilled);
        
        await supabase.from('obligations').update({
            fulfilled: newFulfilled,
            deficit,
            status
        }).eq('company_id', company_id);
    }
    
    // 3. Create transaction
    const { data: txn, error } = await supabase.from('transactions').insert({
        buyer_id: company_id,
        seller_id: credit.owner, // Simplified assuming owner string is the seller_id for now
        quantity,
        price: credit.price,
        status: 'completed'
    }).select().single();

    if (error) return res.status(500).json({ error: error.message });
    
    res.json({ message: 'Purchase successful', transaction: txn });
});

// ==========================================
// API 5: POST /ai-insights
// ==========================================
app.post('/ai-insights', async (req, res) => {
    const { emissions, deficit } = req.body;
    
    if (emissions === undefined || deficit === undefined) {
        return res.status(400).json({ error: "emissions and deficit are required" });
    }
    
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `User emissions = ${emissions}, deficit = ${deficit}.
Suggest:
1. Reduction actions
2. Credit buying strategy`;

        const result = await model.generateContent(prompt);
        
        res.json({ insights: result.response.text() });
    } catch (error) {
        // Fallback for mock environment when API keys are not valid
        console.error("Gemini Error:", error.message);
        res.json({
            insights: "AI (Mock Response):\n1. Consider replacing old machinery and utilizing renewable energy to drop emissions by at least 15%.\n2. Your deficit is high; buy credits immediately from trusted recyclers in bulk to lower the cost impact."
        });
    }
});

// ==========================================
// API 6: GET /report/:company_id
// ==========================================
app.get('/report/:company_id', async (req, res) => {
    const { company_id } = req.params;
    
    try {
        const { data: company } = await supabase.from('companies').select('*').eq('id', company_id).single();
        const { data: obligations } = await supabase.from('obligations').select('*').eq('company_id', company_id).single();
        const { data: emissions } = await supabase.from('emissions').select('*').eq('company_id', company_id).single();
        const { data: transactions } = await supabase.from('transactions').select('*').eq('buyer_id', company_id);
        
        const complianceSummary = {
            company: company || { id: company_id, name: 'Unknown Company' },
            obligations: obligations || {},
            emissions: emissions || {},
            recent_transactions: transactions || [],
            generated_at: new Date().toISOString()
        };
        
        res.json({ summary: complianceSummary });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`CarbonOS Backend is running on port ${PORT}`);
    });
}
module.exports = app;
