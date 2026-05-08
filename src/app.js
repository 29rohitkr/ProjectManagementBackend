import express from "express";
import cors from "cors";

const app = express();

// Basic Middlewares
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

//cors configuration
app.use(cors(
    {
        origin: process.env.CORS_ORIGIN?.split(",") || "https://localhost:5173",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    },
));

// import the routes
import healthCheckRouter from "./routes/healthcheck.routes.js"
app.use("/api/v1/healthcheck", healthCheckRouter);

import authRouter from "./routes/auth.routes.js"
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/auth", authRouter);

app.get("/", (req, res) => {
    res.send("Welcome to Project Management HomePage.");
});

app.get("/login", (req, res) => {
    res.send("This is login page");
})

export default app;