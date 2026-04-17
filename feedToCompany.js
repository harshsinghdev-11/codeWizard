const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
dotenv.config();
const RegulatoryFeed = require('./model/regulatory');
const Company = require('./model/company');
const InternalDocument = require('./model/internal_document');

const SLACK_TOKEN = process.env.SLACK_TOKEN;
async function sendMessage(company, feed, affectedDocs) {
    const docsText = affectedDocs.length > 0 
        ? affectedDocs.map(doc => `• *${doc.title}* (${doc.doc_id})`).join("\n")
        : "_No specific internal documents currently mapped. Review might be needed._";

    const blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": `🚨 Regulatory Alert: ${company.name}`,
                "emoji": true
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `*New Feed:* ${feed.title}\n*Impact Level:* ${feed.impact_level === 'High' ? '🔴' : feed.impact_level === 'Medium' ? '🟡' : '🟢'} ${feed.impact_level}\n\n*Summary:*\n${feed.summary}`
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `*Impacted Internal Documents:*\n${docsText}`
            }
        }
    ];

    const response = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${SLACK_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            channel: "#test",
            text: `🚨 Regulatory alert: ${company.name} is impacted by ${feed.title}`,
            blocks: blocks
        })
    });

    const data = await response.json();
    console.log("Slack API response:", data);
    if (!data.ok) {
        console.error(`Slack message failed for ${company.name}:`, data.error);
    }
}

router.get("/getFeed", async (req, res) => {
    try {
        // ✅ Correct field name for sorting
        const latestFeed = await RegulatoryFeed.findOne({ isDone: false }).sort({ published_date: -1 });

        // ✅ Null check before accessing fields
        if (!latestFeed) {
            return res.status(404).json({ message: "No pending feed found" });
        }
        console.log(SLACK_TOKEN);
        const applicableIndustries = latestFeed.applicable_industries;
        
        // Retrieve companies and populate their implemented documents for more granular details
        const impactedCompanies = await Company.find({ industry: { $in: applicableIndustries } })
            .populate('documents_implemented');

        // Also retrieve specific internal documents that are directly impacted by this regulation
        const impactedDocuments = await InternalDocument.find({ 
            related_regulation: latestFeed.related_regulation 
        }).populate('company_ids');

        for (let company of impactedCompanies) {
            // Find which of this company's implemented documents are directly affected
            const affectedDocs = company.documents_implemented.filter(
                doc => doc.related_regulation === latestFeed.related_regulation
            );
            await sendMessage(company, latestFeed, affectedDocs);
            console.log("Company impacted: ", company.name);
        }

        res.json({ 
            feed: latestFeed, 
            impactedCompanies,
            impactedDocuments,
            summary: {
                total_companies_impacted: impactedCompanies.length,
                total_documents_impacted: impactedDocuments.length,
                impact_level: latestFeed.impact_level,
                recommended_action: impactedDocuments.length > 0 
                    ? "Review and update the impacted internal documents to ensure compliance." 
                    : "Assess if new internal policies need to be created for this regulation."
            }
        });
    } catch (error) {
        console.error("Error fetching feed:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;