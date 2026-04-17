// {
//   "doc_id": "DOC001",
//   "title": "Data Privacy Policy",
//   "type": "policy",
//   "related_regulation": "GDPR",
//   "content": "We collect user data such as name, email, and transaction history. Data is stored securely in our servers. Users can request data deletion by contacting support. However, encryption standards are not clearly defined.",
//   "last_updated": "2025-01-10",
//   "owner": "Compliance Team",
//   "status": "active",
//   "review_frequency": "yearly",
//   "risk_notes": "Encryption standards not defined"
// }


const connectDB = require('./db');
const InternalDocument = require('./model/internal_document');
const dummyDocument = {
  "doc_id": "DOC001",
  "title": "Data Privacy Policy",
  "type": "policy",
  "related_regulation": "GDPR",
  "content": "We collect user data such as name, email, and transaction history. Data is stored securely in our servers. Users can request data deletion by contacting support. However, encryption standards are not clearly defined.",
  "last_updated": "2025-01-10",
  "owner": "Compliance Team",
  "status": "active",
  "review_frequency": "yearly",
  "risk_notes": "Encryption standards not defined"

}
async function addDummyDocument() {
    try {
        await connectDB();
        const newDocument = new InternalDocument(dummyDocument);
        await newDocument.save();
        console.log("Dummy document added successfully!");
    } catch (error) {
        console.error("Error adding dummy document:", error);
    }
}

addDummyDocument();