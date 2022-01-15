const User = require("../models/User");
const Rank = require("../models/Rank");
const Objects = require("../models/Object");
const bcrypt = require("bcrypt");

// Create - attempt to create a User after registration
// Currently uses AJAX for validation and showing errors to users, which is why some errors simply
// register the page again (checks are kept here in case the API isn't used)
exports.create = async (req, res) => {
    try {
        // Get the default rank from the database
        const defaultRank = await Rank.findOne({ rankScoreNeeded: 0 });
        if (!defaultRank) {
            console.log("The default rank wasn't found!");
            res.render("register");
            return;
        };
        
        // Attempt to create the user and save, this will only work if the username and email are unique
        const user = new User({ username: req.body.username.trim(), email: req.body.email.trim(), password: req.body.password, bio:"Not given", rankScore: 0, rank: defaultRank});
        await user.save();

        console.log(`${req.body.username} has been registered`);
        res.redirect(`/login?message=Your account has been created, ${req.body.username}! You can now login through the form below.`);

    } catch (e) {
        // Something went wrong, the username or email may be taken
        console.log(`Encountered an error when making a user: ${e.message}`);

        if (e.code === 11000) {
            res.render("register");
            return;
            
        } else {
            res.render("register");
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
        // Something went wrong when signing in
        console.log(`Encountered an error when signing into a user: ${e}`);
        res.render("login", { errors: e.errors });
        return;
    };
};

// View - attempt to view a user account
exports.view = async (req, res) => {
    const usernameToFind = req.params.username;
    
    try {
        // Attempt to find the user, their rank and publically listed objects
        const foundUser = await User.findOne({ username: usernameToFind })
            .populate({ path: "createdObjects", match: { isPrivate: "false" } })
            .populate("rank");

        if (!foundUser) {
            console.log(`Couldn't find username ${usernameToFind}`);
            res.render("404");
            return;
        };

        // The user was found
        const foundUserUpdated = new Date(foundUser.updatedAt);
        
        res.render("viewProfile", {foundUser: foundUser, foundUserUpdated: foundUserUpdated.toDateString(), message: req.query.message, error: req.query.error});

    } catch (e) {
        // Something went wrong, the username or email may be taken
        console.log(`Encountered an error when viewing user: ${e}`);

        res.redirect("/?error=An error happened when trying to view the profile (roles might be messged up), contact an admin.");
        return;
    };
};

// Edit - attempt to edit a user account (currently just their bio)
exports.edit = async (req, res) => {
    const bioToSet = req.body.bio;
    
    try {
        // Firstly, ensure the user editing the profile is the user themselves
        const foundUser = await User.findById(req.session.userID);

        if (!foundUser) {
            console.log(`Couldn't edit user ${req.session.userID}`);
            res.redirect(`/?error=Couldn't edit your account (not found).`);
            return;
        };

        // If the code reaches here, it's safe to update the bio of foundUser
        await User.updateOne(foundUser, {bio: bioToSet}, { runValidators: true });
        
        res.redirect(`/profile/view/${foundUser.username}?message=Your bio has been updated!`);

    } catch (e) {
        // Something went wrong, the bio was most likely too long (this will be replaced with AJAX)
        console.log(`Encountered an error when editing user: ${e}`);

        res.redirect(`/profile/view/${foundUser.username}?error=Your bio couldn't be updated, it might be too long.`);
        return;
    };
};

// Delete - attempt to delete a user account and its objects
exports.delete = async (req, res) => {
    try {
        // Firstly, ensure the user is deleting their own account
        const foundUser = await User.findById(req.session.userID);

        if (!foundUser) {
            console.log(`Couldn't delete user ${req.session.userID}`);
            res.redirect(`/?error=Couldn't delete your account (not found).`);
            return;
        };

        // If the code reaches here, it's safe to delete foundUser and their objects
        await Objects.deleteMany({ _id: { $in: foundUser.createdObjects } });
        await User.deleteOne(foundUser);
        req.session.destroy();

        console.log(`${foundUser.username} has been deleted`);
        
        res.redirect(`/?message=Your account has been deleted.`);

    } catch (e) {
        // Something went wrong, the user may already be deleted
        console.log(`Encountered an error when editing user: ${e}`);

        res.redirect(`/?error=Your account couldn't be deleted, it may already be gone.`);
        return;
    };
};