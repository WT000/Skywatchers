const User = require("../models/User");
const Rank = require("../models/Rank");
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
        const user = new User({ username: req.body.username, email: req.body.email, password: req.body.password, rankScore: 0, rank: defaultRank});
        await user.save();

        console.log(`${req.body.username} has been registered.`);
        res.redirect(`/?message=Welcome to Skywatchers, ${req.body.username}!`);

    } catch (e) {
        // Something went wrong, the username or email may be taken
        console.log(`Encountered an error when making a user: ${e}`);

        if (e.code === 11000) {
            console.log(e.message);

            let internalErrors = {};

            for (variable in e.keyValue) {
                let newMessage = `${variable} is taken.`;
                newMessage = newMessage[0].toUpperCase() + newMessage.slice(1);

                let newEntry = { message: newMessage };
                internalErrors[variable] = newEntry;
            };

            console.log({ errors: { username: { message: "test" } } });
            console.log({ errors: internalErrors });

            // res.render("register", { errors: e.keyValue });
            res.render("register", { errors: internalErrors } );
            return;
            
        } else {
            console.log(e.message);
            res.render("register", { errors: e.errors });
            return;
        };
    };
};
