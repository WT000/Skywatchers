const User = require("../models/User");
const Rank = require("../models/Rank");
const Objects = require("../models/Object");
const Type = require("../models/Type");
const errors = require("./functions/get-errors.js")

exports.view = async (req, res) => {
    // Simply get the available Type's for the select option
    try {
        // Get the default types from the database
        const currentTypes = await Type.find({});
        if (!currentTypes) {
            console.log("Couldn't find the types, they're not in the database!");
            res.redirect("/?error=Something went wrong with types, contact an admin");
            return;
        };
        
        res.render("addObject", { types: currentTypes });

    } catch (e) {
        // Something went wrong
        console.log(`Encountered an error when finding types: ${e.message}`);
        res.redirect("/?error=Something went wrong with types, contact an admin");
        return;
    };
};

// Create - attempt to create an object
exports.create = async (req, res) => {
    try {
        // Find the user in the database
        const foundUser = await User.findById(req.session.userID)
            .populate("rank");
        
        if (!foundUser) {
            console.log(`Couldn't find user ${req.session.userID}`);
            res.redirect(`/?error=We couldn't find your account, it may be deleted.`);
            return;
        };

        // Required data
        let name = req.body.name;
        let type = req.body.type;
        let isPrivate = true;

        // Optional data
        let description = req.body.description;
        let otherNames = req.body.otherNames;
        let apparentMagnitude = req.body.apparentMagnitude;
        //let image = req.body.image;

        if (!name || !type) {
            res.redirect(`/?error=Invalid entry.`);
            return;
        };

        // Convert data to the correct format (type)
        const foundType = await Type.findOne({ _id: req.body.type });
        if (!foundType) {
            console.log(`Couldn't find type ${req.body.type}`);
            res.redirect(`/?error=We couldn't find the type, it may be deleted.`);
            return;
        };
        type = foundType;
        
        // Convert data to the correct format (show publicly)
        if (req.body.showPublic) {
            isPrivate = false;
        };

        // Convert data to the correct format (other names)
        if (req.body.otherNames) {
            let names = req.body.otherNames.replace(/\s/g,'');
            otherNames = names.split(",");
            console.log(otherNames);
        };

        // Convert data to the correct format (magnitude)
        if (req.body.apparentMagnitude !== "") {
            try {
                apparentMagnitude = parseFloat(req.body.apparentMagnitude);
            } catch (e) {
                res.redirect(`/?error=Invalid magnitude.`);
                return;
            }
        };

        // Convert data to the correct format (image (png, gif, jpeg))

        // Attempt to create the object and save, this will only work if the username and email are unique
        const newObject = new Objects({ name: name.trim(), otherNames: otherNames, type: type, description: description, apparentMagnitude: apparentMagnitude, uploader: foundUser, isPrivate: isPrivate });
        
        if (!isPrivate) {
            // Verify that the name is unique before making it publically saved
            const publicDuplicateCheck = await Objects.find({ name: name, isPrivate: false });
            if (publicDuplicateCheck.length > 0) {
                console.log(`Duplicate public object attempted to be made: ${name}`);
                res.redirect(`/?error=The object has already been publicly listed by another user.`);
                return;
            };
        };

        await newObject.save();
        await User.updateOne(foundUser, { $push: { createdObjects: newObject.id } });

        // If the code reaches here, we can put the object in the users created objects, update their rankScore and see if they've levelled up

        // If making public, lookup the new rank score and find the highest rank which is less than the current rank, if it's different to
        // the current rank then the user can level up
        if (!isPrivate) {
            const upgradeRank = await Rank.findOne({ rankScoreNeeded: { $lte: foundUser.rankScore + foundType.rankScore } }).sort({ rankScoreNeeded: -1 });

            if (upgradeRank.name === foundUser.rank.name) {
                await User.findByIdAndUpdate(foundUser.id, { $inc: { rankScore: foundType.rankScore } });
            } else {        
                console.log(`${foundUser.username} has leveled up to ${upgradeRank.name}`);
                await User.findByIdAndUpdate(foundUser.id, { $inc: { rankScore: foundType.rankScore }, rank: upgradeRank.id });
            };
        };

        console.log(`${req.body.name} has been created`);
        res.redirect(`/?message=${req.body.name} has been created!`);

    } catch (e) {
        // Something went wrong when making the object
        console.log(`Encountered an error when making an object: ${e.message}`);

        if (e.code === 11000) {
            res.redirect("/?error=The object has already been created");
            return;
            
        } else {
            res.redirect("/?error=The object couldn't be created");
            return;
        };
    };
};

// Database - display all the public objects in A-Z order by default
exports.database = async (req, res) => {
    try {        
        const currentTypes = await Type.find({});
        if (!currentTypes) {
            console.log("Couldn't find the types, they're not in the database!");
            res.redirect("/?error=Something went wrong with types, contact an admin");
            return;
        };
        
        res.render("database", {types: currentTypes, query: req.query});

    } catch (e) {
        // Something went wrong
        console.log(`Encountered an error when viewing the database: ${e}`);

        res.redirect("/?error=An error happened when trying to connect to the database, contact an admin.");
        return;
    };
};