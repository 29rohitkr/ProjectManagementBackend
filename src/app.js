import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Basic Middlewares
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

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

app.get("/", (req, res) => {
    res.send("Welcome to Project Management HomePage.");
});

app.get("/login", (req, res) => {
    res.send("This is login page");
})

// after implementing when throwing error. It is send in json format
// Global Error handling middleware
app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
        success: false,
        statusCode: err.statusCode,
        message: err.message,
        errors: err.errors
    });
});

export default app;