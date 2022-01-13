const User = require("../../models/User");
const Rank = require("../../models/Rank");

exports.validate = async (req, res) => {
    const usernameToFind = req.query.username;
    const emailToFind = req.query.email;
    const passwordToTry = req.query.password;
    
    if (!usernameToFind) {
        res.json({ "errors": { "username": { "message": "Invalid Username" } } });
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
            res.json({ "errors": { "rank": { "message": "Coudn't find the default rank, contact an admin." } } });
            return;
        };

        // Test if the user will be valid in the database, this will generate an exception if it isn't (meaning we know
        // to not POST the user), else allow the user to be added to the database
        const user = new User({ username: usernameToFind, email: emailToFind, password: passwordToTry, bio:"Not given", rankScore: 0, rank: defaultRank});
        await user.validate();
        
        // If it was a success, errors will be empty
        res.json({ "errors": {} });

    } catch (e) {
        console.log(e);
        // Something went wrong, the username or email may be taken / the password is too short
        if (e.code === 11000) {
            let internalErrors = errors.getErrors(e);

            res.json({ errors: internalErrors } );
            
        } else {
            res.json({ errors: e.errors });
        };
    };
};