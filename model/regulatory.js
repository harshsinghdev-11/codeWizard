const mongoose = require('mongoose');


// {
//   "feed_id": "FEED001",
//   "title": "RBI introduces Video KYC and periodic re-verification",
//   "related_regulation": "RBI KYC Guidelines",
//   "summary": "Banks must adopt video KYC and re-verify users periodically.",
//   "source": "RBI",
//   "region": "India",
//   "applicable_industries": ["Fintech", "Banking"],
//   "key_changes": [
//     "Video KYC is now mandatory",
//     "Periodic re-verification required"
//   ],
//   "impact_level": "High",
//   "published_date": "2025-03-01"
// }

const regulatoryFeedSchema = new mongoose.Schema({
    feed_id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    related_regulation: { type: String, required: true },
    summary: { type: String, required: true },
    source: { type: String, required: true },
    region: { type: String, required: true },
    applicable_industries: { type: [String], required: true },
    key_changes: { type: [String], required: true },
    impact_level: { type: String, required: true },
    published_date: { type: Date, required: true },
    isDone:{
        type:Boolean,
        default:false
    }

})

const RegulatoryFeed = mongoose.model('RegulatoryFeed', regulatoryFeedSchema);

module.exports = RegulatoryFeed;