import express from "express";
import cors from "cors";

const app = express();

// Basic Middlewares
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));



app.get("/", (req, res) => {
    res.send("Welcome to Project Management HomePage.");
});

app.get("/login", (req, res) => {
    res.send("This is login page");
})

export default app;