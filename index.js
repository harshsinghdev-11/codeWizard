const express = require('express');
const connectDB = require('./db');
const Company = require('./model/company');
const InternalDocument = require('./model/internal_document');

const app = express();
app.use(express.json());
const feedToCompanyRouter = require('./feedToCompany');
connectDB();
app.use('/feed', feedToCompanyRouter);


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