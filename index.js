const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const Company = require('./model/company');
const InternalDocument = require('./model/internal_document');
const RegulatoryFeed = require('./model/regulatory');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_123';

const feedToCompanyRouter = require('./feedToCompany');
connectDB();
app.use('/feed', feedToCompanyRouter);

app.post("/registerCompany", async (req, res) => {
    try {
        const { name, password, industry, region, company_size, services, handles_user_data, kyc_required, transaction_volume } = req.body;
        
        if (!password) {
            return res.status(400).json({ message: "Password is required" });
        }

        const company_id = `COMP-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const hashedPassword = await bcrypt.hash(password, 10);

        const newCompany = new Company({
            company_id,
            password: hashedPassword,
            name,
            industry,
            region,
            company_size,
            services: Array.isArray(services) ? services : (services || "").split(',').map(s => s.trim()).filter(Boolean),
            handles_user_data: handles_user_data === true || handles_user_data === "true",
            kyc_required: kyc_required === true || kyc_required === "true",
            transaction_volume,
            documents_implemented: [],
            last_compliance_check: new Date()
        });

        await newCompany.save();
        res.status(201).json({ message: "Company registered successfully", company: newCompany, company_id });
    } catch (error) {
        console.error("Error registering company:", error);
        if (error.code === 11000) {
            return res.status(400).json({ message: "Failed to generate unique Company ID. Please try again." });
        }
        res.status(500).json({ message: "Internal server error" });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { company_id, password } = req.body;
        if (!company_id || !password) {
            return res.status(400).json({ message: "company_id and password are required" });
        }

        const company = await Company.findOne({ company_id });
        if (!company) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, company.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ company_id: company.company_id, _id: company._id }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ message: "Logged in successfully", token, company });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.post("/api/analyze-gap", async (req, res) => {
    try {
        const { feed_id } = req.body;
        if (!feed_id) {
            return res.status(400).json({ message: "feed_id is required" });
        }

        const feed = await RegulatoryFeed.findOne({ feed_id });
        if (!feed) return res.status(404).json({ message: "Feed not found" });

        const documents = await InternalDocument.find({ related_regulation: feed.related_regulation });

        let documentContent = documents.length > 0
            ? documents.map(doc => `Document Title: ${doc.title}\nContent:\n${doc.content}`).join('\n\n')
            : "No internal documents are currently implemented for this regulation.";

        const prompt = `
You are a senior compliance officer and AI auditor.
Provide a step-by-step guide and gap analysis comparing the new regulatory guidance against our current internal documents.

New Regulatory Guidance:
Title: ${feed.title}
Summary: ${feed.summary}
Key Changes: ${feed.key_changes.join(', ')}

Current Internal Documents Status:
${documentContent}

Provide a structured, professional Markdown report containing:
1. **Executive Summary**: Brief overview of the impact.
2. **Identified Gaps**: Bullet points of what is missing or non-compliant in our current documents.
3. **Step-by-step Guide**: Clear, actionable, step-by-step recommendations on exactly what sections to update to achieve compliance.
`;

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });

        res.json({ report: response.text });
    } catch (error) {
        console.error("AI Analysis Error:", error);
        res.status(500).json({ message: "Failed to generate AI analysis", error: error.message });
    }
});

app.post("/addDocumentToCompany", async (req, res) => {
    const { company_id, doc_id } = req.body;
    console.log({ company_id, doc_id });
    try {
        const company = await Company.findOne({ company_id });
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }

        const document = await InternalDocument.findOne({ doc_id });
        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        // ✅ Guard against duplicate entries before pushing
        const alreadyLinked = company.documents_implemented.some(
            (id) => id.equals(document._id)
        );
        if (alreadyLinked) {
            return res.status(400).json({ message: "Document already added to this company" });
        }

        // ✅ Push MongoDB _id references, not raw string IDs
        company.documents_implemented.push(document._id);
        document.company_ids.push(company._id);

        await company.save();
        await document.save();

        res.status(200).json({ message: "Document added to company successfully" });
    } catch (error) {
        console.error("Error adding document to company:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});