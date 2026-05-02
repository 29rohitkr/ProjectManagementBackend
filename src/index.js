import dotenv from 'dotenv';
import app from "./app.js"
import connectDB from './db/index.js';

import dns from "node:dns/promises";
// console.log(await dns.getServers());
dns.setServers(["1.1.1.1"]);

dotenv.config({
    path: "./.env"
});

const port = process.env.PORT || 3000;


connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`Application listening on port http://localhost:${port}`);
        })
    })
    .catch((err) => {
        console.error("MongDB connection error", err);
        process.exit(1);
    })




