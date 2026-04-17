const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');
const dnsServers = process.env.DNS_SERVERS
  ? process.env.DNS_SERVERS.split(',').map((server) => server.trim()).filter(Boolean)
  : ['8.8.8.8', '1.1.1.1'];

dns.setServers(dnsServers);
dotenv.config();
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}

module.exports = connectDB;