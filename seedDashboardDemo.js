const bcrypt = require('bcryptjs');
const connectDB = require('./db');
const Company = require('./model/company');
const InternalDocument = require('./model/internal_document');
const RegulatoryFeed = require('./model/regulatory');

const DEMO_COMPANY_ID = 'COMP-DEMO1';
const DEMO_PASSWORD = 'Demo@123';

const companyPayload = {
    company_id: DEMO_COMPANY_ID,
    name: 'NimbusPay',
    industry: 'Fintech',
    region: 'India',
    company_size: 'Mid-Market',
    services: ['Digital Wallet', 'Merchant Payments', 'KYC Onboarding', 'Cross-border Payouts'],
    handles_user_data: true,
    kyc_required: true,
    transaction_volume: 'High',
    last_compliance_check: new Date('2026-04-10T10:30:00.000Z'),
    pending_action_items: [
        {
            document_title: 'Customer Data Retention Policy',
            exact_change_instructions: 'Add a clause that all deletion requests from verified users must be completed within 7 calendar days and logged with timestamp, actor, and fulfillment status.',
            related_regulation: 'DPDP 2025'
        },
        {
            document_title: 'Vendor Security Standard',
            exact_change_instructions: 'Require AES-256 encryption for customer data at rest and TLS 1.3 for data in transit across all processors and sub-processors.',
            related_regulation: 'DPDP 2025'
        }
    ]
};

const feedPayload = {
    feed_id: 'FEED-DEMO1',
    title: 'DPDP 2025 Update: Encryption, Deletion SLAs, and Processor Audit Trails',
    related_regulation: 'DPDP 2025',
    summary: 'Digital payment and SaaS businesses must enforce stronger encryption controls, complete customer deletion requests within 7 days, and maintain processor-level audit trails for all access to personal data.',
    source: 'Data Protection Board of India',
    region: 'India',
    applicable_industries: ['Fintech', 'SaaS', 'Banking'],
    key_changes: [
        'AES-256 or equivalent encryption is required for stored personal data',
        'Deletion requests must be processed within 7 days',
        'All personal-data access and deletion events must be recorded in immutable audit logs',
        'Third-party processors must meet the same security and logging standards'
    ],
    impact_level: 'High',
    published_date: new Date('2026-04-15T09:00:00.000Z'),
    isDone: false
};

const documentPayloads = [
    {
        doc_id: 'DOC-DEMO1',
        title: 'Customer Data Retention Policy',
        type: 'Policy',
        related_regulation: 'DPDP 2025',
        content: `Purpose
Define how NimbusPay retains and deletes customer data.

Current Standard
Customer account data is retained for operational and fraud-monitoring purposes. Verified deletion requests are reviewed manually by the support and compliance teams.

Gap
This version does not commit to a 7-day deletion SLA and does not define the audit-log fields that must be captured for each request.`,
        last_updated: new Date('2026-03-22T12:00:00.000Z'),
        owner: 'Compliance Team',
        status: 'Active',
        review_frequency: 'Quarterly',
        risk_notes: 'Needs update for new deletion SLA requirements.'
    },
    {
        doc_id: 'DOC-DEMO2',
        title: 'Vendor Security Standard',
        type: 'Standard',
        related_regulation: 'DPDP 2025',
        content: `Purpose
Set baseline security expectations for processors and infrastructure vendors.

Current Standard
Critical vendors should encrypt sensitive data and maintain reasonable access records.

Gap
This document does not explicitly require AES-256 at rest, TLS 1.3 in transit, or immutable audit trails for processor access events.`,
        last_updated: new Date('2026-02-28T16:30:00.000Z'),
        owner: 'Security Office',
        status: 'Needs Review',
        review_frequency: 'Biannual',
        risk_notes: 'Processor obligations are too generic.'
    },
    {
        doc_id: 'DOC-DEMO3',
        title: 'RBI Video KYC SOP',
        type: 'SOP',
        related_regulation: 'RBI KYC Guidelines',
        content: `Operations teams must conduct live face match validation, PAN verification, and periodic re-verification for high-risk customers.`,
        last_updated: new Date('2026-01-18T08:15:00.000Z'),
        owner: 'Risk Operations',
        status: 'Active',
        review_frequency: 'Monthly',
        risk_notes: 'Aligned with current RBI KYC posture.'
    },
    {
        doc_id: 'DOC-DEMO4',
        title: 'PCI Tokenization Playbook',
        type: 'Playbook',
        related_regulation: 'PCI-DSS',
        content: `Card numbers are tokenized before storage and rotated keys are managed by the platform security team.`,
        last_updated: new Date('2026-04-01T11:45:00.000Z'),
        owner: 'Platform Security',
        status: 'Active',
        review_frequency: 'Quarterly',
        risk_notes: 'No immediate issue from the current feed.'
    }
];

async function seedDashboardDemo() {
    await connectDB();

    const existingCompany = await Company.findOne({ company_id: DEMO_COMPANY_ID });
    if (existingCompany) {
        await InternalDocument.deleteMany({ company_ids: existingCompany._id });
        await Company.deleteOne({ _id: existingCompany._id });
    }

    await RegulatoryFeed.deleteMany({ feed_id: feedPayload.feed_id });
    await InternalDocument.deleteMany({ doc_id: { $in: documentPayloads.map((doc) => doc.doc_id) } });

    const password = await bcrypt.hash(DEMO_PASSWORD, 10);
    const company = await Company.create({
        ...companyPayload,
        password
    });

    const documents = await InternalDocument.insertMany(
        documentPayloads.map((doc) => ({
            ...doc,
            company_ids: [company._id]
        }))
    );

    company.documents_implemented = documents.map((doc) => doc._id);
    await company.save();

    await RegulatoryFeed.create(feedPayload);

    console.log('Dashboard demo data seeded successfully.');
    console.log(`Login with company_id: ${DEMO_COMPANY_ID}`);
    console.log(`Password: ${DEMO_PASSWORD}`);
    console.log('Set localStorage company_id to COMP-DEMO1 if you want to skip the login screen.');
}

seedDashboardDemo()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Failed to seed dashboard demo data:', error);
        process.exit(1);
    });
