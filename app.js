// Setup the requirements
const express = require("express");
const path = require("path");

// Create the app to run on port 3000 and load static resources
const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

// Setup the routes across the app
app.get("/", (req, res) => {
    res.render("index");
});

app.get("/database", (req, res) => {
    res.render("database");
});

app.get("/statistics", (req, res) => {
    res.render("statistics");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/api", (req, res) => {
    res.render("api");
});

// Start the app
const port = 3000;
app.listen(port, () => {
    console.log(`Running the Space Object application at http://localhost:${port}`);
});