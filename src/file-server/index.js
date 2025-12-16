const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.text({ type: ['text/*', 'application/jwt', 'application/jose', 'application/jose+json', 'application/x-www-form-urlencoded', '*/*'], limit: '10mb' }));

app.use(cors({ origin: '*' }));

// Đổi tên biến thống nhất là proofStore
const proofStore = new Map();

// 1. API Register
app.post('/api/register', (req, res) => {
    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) {}
    }
    const { sessionId, electionId } = body || {};
    
    if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

    proofStore.set(sessionId, { status: 'pending', electionId });
    console.log(`📝 Registered session: ${sessionId}`);
    res.json({ status: 'ok' });
});

// 2. API Callback
app.post('/api/callback', (req, res) => {
    const sessionId = req.query.sessionId;
    console.log("📥 Callback received for:", sessionId);
    
    if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

    let proofData = req.body;
    try {
        if (typeof proofData === 'string' && proofData.trim().length > 0) {
            proofData = JSON.parse(proofData);
        }
    } catch (e) {}

    proofStore.set(sessionId, { status: 'done', proof: proofData });
    console.log("✅ Proof stored!");
    return res.status(200).send("OK");
});

// 3. API Polling
app.get('/api/proof', (req, res) => {
    const sessionId = req.query.sessionId;
    
    if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });
    
    const sessionData = proofStore.get(sessionId);

    if (sessionData && sessionData.status === 'done') {
        return res.json({ status: 'done', proof: sessionData.proof });
    }

    // Trả về 200 Pending thay vì 404
    res.status(200).json({ status: 'pending' });
});

const PORT = 8000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});