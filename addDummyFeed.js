const regulatoryFeedDummy = {
  feed_id: "FEED001",
  title: "Updated Data Protection and Encryption Guidelines",
  related_regulation: "GDPR",

  summary: "Organizations must implement strong encryption standards for all stored and transmitted personal data. Users must be provided with a clear and automated mechanism to delete their data within a defined time frame.",

  source: "European Data Protection Authority",
  region: "EU",

  applicable_industries: ["Fintech", "Banking", "SaaS"],

  key_changes: [
    "Mandatory end-to-end encryption for user data",
    "Clear definition of encryption standards (AES-256 or equivalent)",
    "User data deletion requests must be processed within 7 days",
    "Audit logs must be maintained for all data access and deletion requests"
  ],

  impact_level: "High",

  published_date: new Date("2025-03-01")
};

const express = require('express');
const connectDB = require('./db');
const RegulatoryFeed = require('./model/regulatory');
const mongoose = require('mongoose');
const app = express();
app.use(express.json());

connectDB();

async function addDummyFeed() {
    try {
        const newFeed = new RegulatoryFeed(regulatoryFeedDummy);
        await newFeed.save();
        console.log("Dummy regulatory feed added successfully!");
    } catch (error) {
        console.error("Error adding dummy regulatory feed:", error);
    } 
}

addDummyFeed();