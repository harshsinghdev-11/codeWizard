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
const multer = require('multer');
const WordExtractor = require('word-extractor');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_123';

const upload = multer({ storage: multer.memoryStorage() });

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
        const { feed_id, company_id } = req.body;
        if (!feed_id || !company_id) {
            return res.status(400).json({ message: "feed_id and company_id are required" });
        }

        const feed = await RegulatoryFeed.findOne({ feed_id });
        if (!feed) return res.status(404).json({ message: "Feed not found" });

        const company = await Company.findOne({ company_id }).populate('documents_implemented');
        if (!company) return res.status(404).json({ message: "Company not found" });

        // Filter for documents that match the regulation, or fallback to all documents if the user wants general analysis
        const relatedDocs = company.documents_implemented.filter(
            doc => doc.related_regulation === feed.related_regulation
        );

        let documentContent = "";
        if (relatedDocs.length === 0) {
            documentContent = "NO INTERNAL DOCUMENTS FOUND. The company has not implemented any policies for this regulation.";
        } else {
            documentContent = relatedDocs.map(doc => `--- TITLE: ${doc.title} ---\n${doc.content}`).join('\n\n');
        }

        const prompt = `
You are a senior compliance officer and rigorous AI auditor.
Read the New Regulatory Guidance and strictly audit the provided Current Internal Documents.

New Regulatory Guidance:
Title: ${feed.title}
Summary: ${feed.summary}
Key Changes: ${feed.key_changes.join(', ')}

Current Internal Documents Status:
${documentContent.substring(0, 30000)}

You MUST output ONLY a valid, raw JSON object exactly matching this schema:
{
  "executive_summary": "Overview of compliance impact.",
  "compliance_score": 50,
  "critical_gaps": [
    { "section": "Section name", "issue": "What is missing", "severity": "High" }
  ],
  "action_items": [
    { "document_title": "Title to update", "exact_change_instructions": "Exact text to add." }
  ]
}
If no documents exist, set compliance_score to 0, list the missing policies as critical_gaps, and give action items to create them.
`;

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
        });

        let jsonRaw = response.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const data = JSON.parse(jsonRaw);

        res.json({ data });
    } catch (error) {
        console.error("AI Analysis Error:", error);
        res.status(500).json({ message: "Failed to run AI Agent analysis", error: error.message });
    }
});

app.post("/api/documents/upload", upload.single('document'), async (req, res) => {
    try {
        const { company_id, title, type, owner, text_content } = req.body;
        
        if (!company_id) return res.status(400).json({ message: "Company ID is required" });
        if (!title || !type || !owner) return res.status(400).json({ message: "Title, type, and owner are required" });

        let finalContent = text_content || "";

        if (req.file) {
            const ext = req.file.originalname.split('.').pop().toLowerCase();
            if (ext === 'doc' || ext === 'docx') {
                const extractor = new WordExtractor();
                const extracted = await extractor.extract(req.file.buffer);
                finalContent = extracted.getBody();
            } else if (ext === 'txt') {
                finalContent = req.file.buffer.toString('utf-8');
            } else {
                return res.status(400).json({ message: "Unsupported file type. Only .doc, .docx, and .txt are supported." });
            }
        }

        if (!finalContent || finalContent.trim().length === 0) {
            return res.status(400).json({ message: "Document content cannot be empty." });
        }

        const prompt = `
You are a senior compliance officer.
Read the following internal policy document and determine the SINGLE most relevant major regulation it is designed to comply with (e.g., "GDPR", "HIPAA", "CCPA", "PSD2", "PCI-DSS").
If it relates to data privacy, it might be GDPR. If healthcare, HIPAA. If banking, PSD2.
Respond ONLY with the name of the regulation. Do not provide any explanation or extra text.

Document Content:
${finalContent.substring(0, 10000)}
`;

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
        });

        let relatedRegulation = response.text.trim();
        if (relatedRegulation.length > 30) {
            relatedRegulation = "General Compliance";
        }

        const doc_id = `DOC-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const company = await Company.findOne({ company_id });
        if (!company) return res.status(404).json({ message: "Company not found" });

        const newDoc = new InternalDocument({
            doc_id,
            title,
            type,
            related_regulation: relatedRegulation,
            content: finalContent,
            last_updated: new Date(),
            owner,
            company_ids: [company._id],
            status: "Active"
        });

        await newDoc.save();

        company.documents_implemented.push(newDoc._id);
        await company.save();

        res.status(201).json({ 
            message: "Document uploaded and mapped successfully", 
            document: newDoc 
        });
    } catch (error) {
        console.error("Document Upload Error:", error);
        res.status(500).json({ message: "Failed to process document", error: error.message });
    }
});

app.get("/api/documents/:company_id", async (req, res) => {
    try {
        const { company_id } = req.params;
        const company = await Company.findOne({ company_id }).populate('documents_implemented');
        
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }

        res.status(200).json({ documents: company.documents_implemented });
    } catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ message: "Failed to fetch documents", error: error.message });
    }
});

app.get("/api/action-items/:company_id", async (req, res) => {
    try {
        const { company_id } = req.params;
        const company = await Company.findOne({ company_id });
        if (!company) return res.status(404).json({ message: "Company not found" });
        res.status(200).json({ action_items: company.pending_action_items || [] });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch action items", error: error.message });
    }
});

app.post("/api/action-items/:company_id", async (req, res) => {
    try {
        const { company_id } = req.params;
        const { items, related_regulation } = req.body; // array of items
        const company = await Company.findOne({ company_id });
        if (!company) return res.status(404).json({ message: "Company not found" });
        
        const newItems = items.map(item => ({
            document_title: item.document_title,
            exact_change_instructions: item.exact_change_instructions,
            related_regulation: related_regulation
        }));
        
        company.pending_action_items.push(...newItems);
        await company.save();
        res.status(200).json({ message: "Action items saved", action_items: company.pending_action_items });
    } catch (error) {
        res.status(500).json({ message: "Failed to save action items", error: error.message });
    }
});

app.delete("/api/action-items/:company_id/:item_id", async (req, res) => {
    try {
        const { company_id, item_id } = req.params;
        const company = await Company.findOne({ company_id });
        if (!company) return res.status(404).json({ message: "Company not found" });
        
        company.pending_action_items = company.pending_action_items.filter(item => item._id.toString() !== item_id);
        await company.save();
        res.status(200).json({ message: "Action item removed", action_items: company.pending_action_items });
    } catch (error) {
        res.status(500).json({ message: "Failed to remove action item", error: error.message });
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