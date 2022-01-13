const User = require("../models/User");
const Rank = require("../models/Rank");
const Object = require("../models/Object");
const bcrypt = require("bcrypt");

// Create - attempt to create a User after registration
exports.create = async (req, res) => {
    try {
        // Get the default rank from the database
        const defaultRank = await Rank.findOne({ rankScoreNeeded: 0 });
        if (!defaultRank) {
            console.log("The default rank wasn't found!");
            res.render("register", { errors: { rank: { message: "Coudn't make the default rank, contact an admin." } } });
            return;
        };
        
        // Attempt to create the user and save, this will only work if the username and email are unique
        const user = new User({ username: req.body.username, email: req.body.email, password: req.body.password, bio:"Not given", rankScore: 0, rank: defaultRank});
        await user.save();

        console.log(`${req.body.username} has been registered`);
        res.redirect(`/login?message=Your account has been created, ${req.body.username}! You can now login through the form below.`);

    } catch (e) {
        // Something went wrong, the username or email may be taken
        console.log(`Encountered an error when making a user: ${e.message}`);

        if (e.code === 11000) {
            let internalErrors = {};

            for (variable in e.keyValue) {
                let newMessage = `${variable} is taken.`;
                newMessage = newMessage[0].toUpperCase() + newMessage.slice(1);

                let newEntry = { message: newMessage };
                internalErrors[variable] = newEntry;
            };

            res.render("register", { errors: internalErrors } );
            return;
            
        } else {
            res.render("register", { errors: e.errors });
            return;
        };
    };
};


// Login - attempt to login with a user account
exports.login = async (req, res) => {
    try {
        // Get the default rank from the database
        const foundUser = await User.findOne({ username: req.body.username });
        if (!foundUser) {
            console.log(`Couldn't find username ${req.body.username}`);
            res.render("login", { errors: { username: { message: `The user "${req.body.username}" doesn't exist.` } }, message: false });
            return;
        };
        
        // Attempt to login with the entered password
        if (await bcrypt.compare(req.body.password, foundUser.password)) {
            req.session.userID = foundUser._id;
            // Extend the session from 1 day to 15 days if remember me is checked
            if (req.body.rememberMe) {
                req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 15;
            };

            res.redirect(`/?message=Welcome to Skywatchers, ${req.body.username}!`);
            return;
        };

        res.render("login", { errors: { username: { message: `Incorrect password for user ${req.body.username}.` } }, message: false });

    } catch (e) {
        // Something went wrong, the username or email may be taken
        console.log(`Encountered an error when singing into a user: ${e}`);

        if (e.code === 11000) {
            console.log(e.message);

            let internalErrors = {};

            for (variable in e.keyValue) {
                let newMessage = `${variable} is taken.`;
                newMessage = newMessage[0].toUpperCase() + newMessage.slice(1);

                let newEntry = { message: newMessage };
                internalErrors[variable] = newEntry;
            };
            
            res.render("register", { errors: internalErrors } );
            return;
            
        } else {
            console.log(e.message);
            res.render("register", { errors: e.errors });
            return;
        };
    };
};

// View - attempt to view a user account
exports.view = async (req, res) => {
    const usernameToFind = req.params.username;
    
    try {
        // Attempt to find the user
        const foundUser = await User.findOne({ username: usernameToFind })
            .populate("createdObjects", { match: { isPublic: true } })
            .populate("rank");

        if (!foundUser) {
            console.log(`Couldn't find username ${usernameToFind}`);
            res.redirect(`/?error=Couldn't find ${usernameToFind}.`);
            return;
        };
        
        const foundUserUpdated = new Date(foundUser.updatedAt);
        
        // The user was found
        res.render("viewProfile", {foundUser: foundUser, foundUserUpdated: foundUserUpdated.toDateString()});

    } catch (e) {
        // Something went wrong, the username or email may be taken
        console.log(`Encountered an error when viewing user: ${e}`);
        console.log(e.message);

        res.redirect("/?error=An error happened when trying to view the profile (roles might be messged up), contact an admin.");
        return;
    };
};