/*
    REQUIRED CONSTANTS - Setting the core constants 
*/
// Requirements
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const expressSession = require("express-session");
const MemoryStore = require("memorystore")(expressSession);

// Models
const User = require("./models/User");

// Controllers
const userController = require("./controllers/user");
const apiUserController = require("./controllers/api/user");
const objectController = require("./controllers/object");
const apiObjectController = require("./controllers/api/object");

/*
    APP SETUP - Setting up the application, such as json configuration, cookies, etc
*/
// Create the app and configure what it needs to use (e.g. public folder and cookies)
// Note that body-parser now comes with Express by default
const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

// Sesssion lasts for 24 hours, extends to 30 days if remember me is checked
// Expired cookies are purged every 24 hours, used to prevent memory leaks (the warning of which sometimes appears in the console without this)
app.use(expressSession({
    secret: "Space is very cool!",
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
    store: new MemoryStore({
        checkPeriod: 1000 * 60 * 60 * 24
    }),
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
    DB CONNECTION - Connecting to the configured .env database
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
    SETUP ROUTES - Setting where the users can go
*/
// Prepare authMiddleware to ensure users don't go where they're not supposed to
const signedOutMiddleware = async (req, res, next) => {
    const sessionUser = await User.findById(req.session.userID);

    // Check if they're not signed in
    if (!sessionUser) {
        return res.redirect("/?error=You're not permitted to do this.");
    };

    next();
};

const signedInMiddleware = async (req, res, next) => {
    const sessionUser = await User.findById(req.session.userID);

    // Check if they ARE signed in
    if (sessionUser) {
        return res.redirect("/?error=You're already signed in.");
    };

    next();
};

// Setup the routes across the app
// Index
app.get("/", (req, res) => {
    res.render("index", { message: req.query.message, error: req.query.error });
});

// Database and object specifics
app.get("/database", objectController.database);
app.get("/api/database/search", apiObjectController.find);

app.get("/object/view/:id", objectController.view);
app.post("/object/delete", signedOutMiddleware, objectController.delete);

// Object speicifcs (viewing objects, editing objects, etc)
app.get("/viewObject", (req, res) => {
    res.render("viewObject");
});

// Registration and Login
app.get("/register", signedInMiddleware, (req, res) => {
    res.render("register");
});
app.post("/register", signedInMiddleware, userController.create);
app.get("/api/validate/register", apiUserController.validate);

app.get("/login", signedInMiddleware, (req, res) => {
    res.render("login", { errors: {}, message: req.query.message });
});
app.post("/login", signedInMiddleware, userController.login);

app.get("/logout", signedOutMiddleware, async (req, res) => {
    req.session.destroy();
    global.user = false;
    res.redirect("/?message=You've successfully logged out.")
});

// Users and their objects
app.get("/profile/view/:username", userController.view);
app.post("/profile/view/:username", signedOutMiddleware, userController.edit);
app.post("/profile/delete", signedOutMiddleware, userController.delete);

app.get("/object/add", signedOutMiddleware, objectController.createForm);
app.post("/object/add", signedOutMiddleware, objectController.create);

app.get("/my-objects", signedOutMiddleware, objectController.personal);
app.get("/api/database/personal", signedOutMiddleware, apiObjectController.personal);

// Object statistics
app.get("/statistics", (req, res) => {
    res.render("statistics");
});

// Public API
app.get("/api", (req, res) => {
    res.render("api");
});

// 404
app.get("*", (req, res) => {
    res.status("404").render("404");
});

/*
    START THE APP - The app is now fully ready to listen on the port
*/
app.listen(PORT, () => {
    console.log(`Running the Space Object application at http://localhost:${PORT}`);
});