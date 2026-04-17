const mongoose = require('mongoose');

const internalDocumentSchema = new mongoose.Schema({
    doc_id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    type: { type: String, required: true },
    related_regulation: { type: String, required: true },
    content: { type: String, required: true },
    last_updated: { type: Date, required: true },
    owner: { type: String, required: true },
    status: { type: String },
    company_ids: [{                          // ✅ renamed + array of ObjectId refs
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    }],
    review_frequency: { type: String },
    risk_notes: { type: String },
});

const InternalDocument = mongoose.model('InternalDocument', internalDocumentSchema);
module.exports = InternalDocument;