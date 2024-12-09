const mongoose = require('mongoose');

const connectDB = async () => {
    const clientOptions = {
        serverApi: { version: "1", strict: true, deprecationErrors: true }
    };

    try {
        await mongoose.connect(process.env.MONGO_URI, clientOptions);
        await mongoose.connection.db.admin().command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (err) {
        console.error("DB error: " + err.message);
    }
};

module.exports = connectDB;