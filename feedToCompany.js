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
        ? affectedDocs.map((doc) => `- *${doc.title}* (${doc.doc_id})`).join("\n")
        : "_No specific internal documents currently mapped. Review might be needed._";

    const blocks = [
        {
            type: "header",
            text: {
                type: "plain_text",
                text: `Regulatory Alert: ${company.name}`,
                emoji: true
            }
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*New Feed:* ${feed.title}\n*Impact Level:* ${feed.impact_level}\n\n*Summary:*\n${feed.summary}`
            }
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*Impacted Internal Documents:*\n${docsText}`
            }
        }
    ];

    const response = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${SLACK_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            channel: "#test",
            text: `Regulatory alert: ${company.name} is impacted by ${feed.title}`,
            blocks
        })
    });

    const data = await response.json();
    console.log("Slack API response:", data);
    if (!data.ok) {
        console.error(`Slack message failed for ${company.name}:`, data.error);
    }
}

router.get("/getFeeds", async (req, res) => {
    try {
        const feeds = await RegulatoryFeed.find({ isDone: false }).sort({ published_date: -1 });

        if (!feeds.length) {
            return res.status(404).json({ message: "No pending feeds found" });
        }

        const latestFeed = feeds[0];
        const impactedCompaniesMap = new Map();
        const impactedDocumentsMap = new Map();
        const feedInsights = [];

        for (const feed of feeds) {
            const applicableIndustries = feed.applicable_industries || [];

            const impactedCompanies = await Company.find({
                industry: { $in: applicableIndustries }
            }).populate('documents_implemented');

            const impactedDocuments = await InternalDocument.find({
                related_regulation: feed.related_regulation
            }).populate('company_ids');

            for (const company of impactedCompanies) {
                const affectedDocs = company.documents_implemented.filter(
                    (doc) => doc.related_regulation === feed.related_regulation
                );

                if (SLACK_TOKEN) {
                    await sendMessage(company, feed, affectedDocs);
                }

                impactedCompaniesMap.set(String(company._id), company);
            }

            for (const document of impactedDocuments) {
                impactedDocumentsMap.set(String(document._id), document);
            }

            feedInsights.push({
                feed_id: feed.feed_id,
                related_regulation: feed.related_regulation,
                impacted_companies_count: impactedCompanies.length,
                impacted_documents_count: impactedDocuments.length,
                recommended_action: impactedDocuments.length > 0
                    ? "Review and update the impacted internal documents to ensure compliance."
                    : "Assess if new internal policies need to be created for this regulation."
            });
        }
        console.log(feeds);
        res.json({
            feeds,
            feed: latestFeed,
            impactedCompanies: Array.from(impactedCompaniesMap.values()),
            impactedDocuments: Array.from(impactedDocumentsMap.values()),
            feedInsights,
            summary: {
                total_pending_feeds: feeds.length,
                total_companies_impacted: impactedCompaniesMap.size,
                total_documents_impacted: impactedDocumentsMap.size,
                impact_level: latestFeed.impact_level,
                recommended_action: impactedDocumentsMap.size > 0
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
