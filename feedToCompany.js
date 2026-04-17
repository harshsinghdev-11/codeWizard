const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
dotenv.config();
const RegulatoryFeed = require('./model/regulatory');
const Company = require('./model/company');
const InternalDocument = require('./model/internal_document');

const SLACK_TOKEN = process.env.SLACK_TOKEN;
async function sendMessage(company) {
    const response = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${SLACK_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            channel: "#test",
            text: `🚨 Regulatory alert: ${company.name} is impacted by a new feed.`
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
        const impactedCompanies = await Company.find({ industry: { $in: applicableIndustries } });

        for (let company of impactedCompanies) {
            await  sendMessage(company);
            console.log("Company impacted: ", company.name);
        }

        res.json({ feed: latestFeed, impactedCompanies });
    } catch (error) {
        console.error("Error fetching feed:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;