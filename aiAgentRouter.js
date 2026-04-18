const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const RegulatoryFeed = require('./model/regulatory');
const InternalDocument = require('./model/internal_document');
const Company = require('./model/company');

router.post("/analyze", async (req, res) => {
    try {
        const { feed_id, company_id } = req.body;
        
        if (!feed_id || !company_id) {
            return res.status(400).json({ message: "feed_id and company_id are required" });
        }

        const feed = await RegulatoryFeed.findOne({ feed_id });
        if (!feed) return res.status(404).json({ message: "Feed not found" });

        const company = await Company.findOne({ company_id });
        if (!company) return res.status(404).json({ message: "Company not found" });

        const documents = await InternalDocument.find({
            _id: { $in: company.documents_implemented },
            related_regulation: feed.related_regulation
        });

        if (documents.length === 0) {
            return res.status(404).json({ message: "No relevant internal documents found for this company to analyze." });
        }

        const documentContent = documents.map(doc => `--- DOCUMENT TITLE: ${doc.title} ---\nCONTENT:\n${doc.content}\n`).join('\n\n');

        const prompt = `
You are a senior compliance officer and rigorous AI auditor.
Read the New Regulatory Guidance and strictly audit the provided Current Internal Documents.

New Regulatory Guidance:
Title: ${feed.title}
Summary: ${feed.summary}
Key Changes: ${feed.key_changes.join(', ')}

Current Internal Documents Status:
${documentContent.substring(0, 30000)}

You MUST output ONLY a valid, raw JSON object (no markdown, no \`\`\`json blocks) exactly matching this schema:
{
  "executive_summary": "A brief, clear overview of the compliance impact specifically tailored to this company's documents.",
  "compliance_score": 50, // An integer out of 100
  "critical_gaps": [
    {
      "section": "Name of section with gap",
      "issue": "Concise explanation of what is missing",
      "severity": "Low" // Must be "Low", "Medium", "High", or "Critical"
    }
  ],
  "action_items": [
    {
      "document_title": "Title of the document to update",
      "exact_change_instructions": "Spoon-fed instructions on exactly what text to add or modify."
    }
  ]
}
`;

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
        });

        let jsonRaw = response.text;
        // Clean markdown blocks if Gemini hallucinates them
        jsonRaw = jsonRaw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const data = JSON.parse(jsonRaw);

        res.json({ data: data });
    } catch (error) {
        console.error("AI Agent Error:", error);
        res.status(500).json({ message: "Failed to run AI Agent analysis", error: error.message });
    }
});

module.exports = router;