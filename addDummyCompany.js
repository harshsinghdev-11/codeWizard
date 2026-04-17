const express = require('express');
const connectDB = require('./db');
const Company = require('./model/company');
const { default: mongoose } = require('mongoose');

const app = express();
app.use(express.json());

connectDB();

// Dummy data for a company
const dummyCompany = {
    company_id: "COMP001",
    name: "FinSecure",
    industry: "Fintech",
    region: "India",
    company_size: "Startup",
    services: ["Digital Payments", "Wallet"],
    handles_user_data: true,
    kyc_required: true,
    transaction_volume: "Medium",
    last_compliance_check: new Date("2025-03-15")
};

// Function to add dummy company
async function addDummyCompany() {
    try {
        const newCompany = new Company(dummyCompany);
        await newCompany.save();
        console.log("Dummy company added successfully!");
    } catch (error) {
        console.error("Error adding dummy company:", error);
    }
}

addDummyCompany();