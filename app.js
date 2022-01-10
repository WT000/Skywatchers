// Setup the requirements
const express = require("express");
const path = require("path");

// Create the app to run on port 3000 and load static resources
const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("index");
});

// Start the app
const port = 3000;
app.listen(port, () => {
    console.log(`Running the Space Object application at http://localhost:${port}`);
});