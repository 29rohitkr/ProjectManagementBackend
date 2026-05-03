import dotenv from 'dotenv';
import app from "./app.js"
import connectDB from './db/index.js';

import dns from "node:dns/promises";
dns.setServers(["1.1.1.1"]);

dotenv.config({
    path: "./.env"
});

const port = process.env.PORT || 3000;

// import the routes
import healthCheckRouter from "./routes/healthcheck.routes.js"

app.use("/api/v1/healthcheck", healthCheckRouter);

connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`Application listening on port http://localhost:${port}`);
        })
    })
    .catch((err) => {
        console.error("MongoDB connection error", err);
        process.exit(1);
    })




