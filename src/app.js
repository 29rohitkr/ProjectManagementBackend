import express from "express";

const app = express();



app.get("/", (req, res) => {
    res.send("Welcome to Project Management HomePage.");
});

app.get("/login", (req, res) => {
    res.send("This is login page");
})

export default app;