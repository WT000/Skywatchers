const User = require("../../models/User");
const Rank = require("../../models/Rank");
const errors = require("../functions/get-errors.js");
const bcrypt = require("bcrypt");

// Uses POST to avoid # errors
exports.validateRegister = async (req, res) => {
    const usernameToFind = req.body.username;
    const emailToFind = req.body.email;
    const passwordToTry = req.body.password;
    
    if (!usernameToFind || usernameToFind.includes("#")) {
        res.json({ "errors": { "username": { "message": "Invalid Username (ensure it doesn't have a #)" } } });
        return;
    } else if (!emailToFind) {
        res.json({ "errors": { "email": { "message": "Invalid Email" } } });
        return;
    } else if (!passwordToTry) {
        res.json({ "errors": { "password": { "message": "Invalid Password" } } });
        return;
    };
    
    try {
        // Get the default rank from the database
        const defaultRank = await Rank.findOne({ rankScoreNeeded: 0 });
        if (!defaultRank) {
            console.log("The default rank wasn't found!");
            res.json({ "errors": { "rank": { "message": "Coudn't find the default rank, contact an admin" } } });
            return;
        };

        // Test if the user will be valid in the database, this will generate an exception if it isn't (meaning we know
        // to not POST the user), else allow the user to be added to the database
        const user = new User({ username: usernameToFind.trim(), email: emailToFind.trim(), password: passwordToTry, bio:"Not given", rankScore: 0, rank: defaultRank});
        await user.validate();

        // Now attempt to see if the username and email are valid
        const foundUsername = await User.findOne({ username: usernameToFind });
        if (foundUsername) {
            res.json({ "errors": { "username": { "message": "The username is taken" } } });
            return;
        };

        const foundEmail = await User.findOne({ email: emailToFind });
        if (foundEmail) {
            res.json({ "errors": { "email": { "message": "The email is being used by another account" } } });
            return;
        };
        
        // If it was a success, errors will be empty
        res.json({ "errors": {} });

    } catch (e) {
        console.log(e.message);
        // Something went wrong, the username or email may be taken and the error wasn't detected above
        if (e.code === 11000) {
            let internalErrors = errors.getErrors(e);

            res.json({ errors: internalErrors } );
            
        } else {
            res.json({ errors: e.errors });
        };
    };
};

// Uses POST to avoid # errors
exports.validateLogin = async (req, res) => {
    const usernameToFind = req.body.username;
    const passwordToTry = req.body.password;
    
    if (!usernameToFind || usernameToFind.includes("#")) {
        res.json({ "errors": { "username": { "message": "Invalid Username (ensure it doesn't have a #)" } } });
        return;
    } else if (!passwordToTry) {
        res.json({ "errors": { "password": { "message": "Invalid Password" } } });
        return;
    };
    
    try {
        // Attempt to see if the username is valid
        const foundUsername = await User.findOne({ username: usernameToFind });
        if (!foundUsername) {
            res.json({ "errors": { "username": { "message": `The user "${usernameToFind}" doesn't exist` } } });
            return;
        };

        // Now, attempt to match the username and the password
        if (await bcrypt.compare(passwordToTry, foundUsername.password)) {
            res.json({ "errors": {} });
            return;
        }
        
        res.json({ "errors": { "password": { "message": "The password is invalid" } } });
        return;

    } catch (e) {
        console.log(e.message);
        // Something went wrong
        if (e.code === 11000) {
            let internalErrors = errors.getErrors(e);

            res.json({ errors: internalErrors } );
            
        } else {
            res.json({ errors: e.errors });
        };
    };
};