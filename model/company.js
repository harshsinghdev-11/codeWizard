const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    company_id: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    industry: { type: String, required: true },
    region: { type: String, required: true },
    company_size: { type: String, required: true },
    services: { type: [String], required: true },
    handles_user_data: { type: Boolean, required: true },
    kyc_required: { type: Boolean, required: true },
    transaction_volume: { type: String, required: true },
    documents_implemented: [{               // ✅ fixed typo + array of ObjectId refs
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InternalDocument'
    }],
    pending_action_items: [{
        document_title: String,
        exact_change_instructions: String,
        related_regulation: String,
        created_at: { type: Date, default: Date.now }
    }],
    last_compliance_check: { type: Date, required: true }
});

const Company = mongoose.model('Company', companySchema);
module.exports = Company;