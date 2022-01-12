/*
    REQUIRED CONSTANTS
*/
// Requirements
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const expressSession = require("express-session");
const User = require("./models/User");

// Controllers
const userController = require("./controllers/user");

/*
    APP SETUP
*/
// Create the app and configure what it needs to use (e.g. public folder and cookies)
// Note that body-parser now comes with Express by default
const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(expressSession({
    secret: "Space is very cool!",
    // Lats for 1 day, extends to 30 days if remember me is checked
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
    resave: true,
    saveUninitialized: true,
}));
app.set("view engine", "ejs");

// Create the user session
app.use("*", async (req, res, next) => {
    global.user = false;
    // If userID exists in the session, sign the user in
    if (req.session.userID && !global.user) {
        const user = await User.findById(req.session.userID);
        global.user = user;
    }
    next();
});

/*
    DB CONNECTION
*/
// Connect to the configured database
require("dotenv").config();
const { PORT, MONGODB_URI } = process.env;

mongoose.connect(MONGODB_URI, { useNewUrlParser: true });
mongoose.connection.on("error", e => {
    console.error(e);
    console.log("Failed to connect to the database, is MongoDB running?");
    process.exit();
});

/*
    SETUP ROUTES
*/
// Setup the routes across the app
// ALL USERS
app.get("/", (req, res) => {
    res.render("index", { message: req.query.message, error: req.query.error });
});

app.get("/database", (req, res) => {
    res.render("database");
});

app.get("/viewObject", (req, res) => {
    res.render("viewObject");
});

app.get("/profile/view/:username", userController.view);

app.get("/statistics", (req, res) => {
    res.render("statistics");
});

app.get("/register", (req, res) => {
    res.render("register", { errors: {} });
});
app.post("/register", userController.create);

app.get("/login", (req, res) => {
    res.render("login", { errors: {}, message: req.query.message });
});
app.post("/login", userController.login);

app.get("/logout", async (req, res) => {
    req.session.destroy();
    global.user = false;
    res.redirect("/?message=You've successfully logged out.")
});

app.get("/api", (req, res) => {
    res.render("api");
});

/*
    START THE APP
*/
app.listen(PORT, () => {
    console.log(`Running the Space Object application at http://localhost:${PORT}`);
});