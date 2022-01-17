const User = require("../models/User");
const Rank = require("../models/Rank");
const Objects = require("../models/Object");
const Type = require("../models/Type");
const errors = require("./functions/get-errors.js")

exports.createForm = async (req, res) => {
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
        if (req.body.otherNames && req.body.otherNames !== "") {
            let names = req.body.otherNames.replace(/\s/g,'');
            otherNames = names.split(",");
        } else {
            otherNames = "Not given";
        };

        // Convert data to the correct format (magnitude)
        if (req.body.apparentMagnitude !== "") {
            try {
                apparentMagnitude = parseFloat(req.body.apparentMagnitude);
            } catch (e) {
                res.redirect(`/?error=Invalid magnitude.`);
                return;
            };
        };

        // Convert data to the correct format (description)
        if (!req.body.description || req.body.description === "") {
            description = "Not given";
        } else {
            description = req.body.description.trim();
        };

        // Convert data to the correct format (image (png, gif, jpeg))

        // Attempt to create the object
        const newObject = new Objects({ name: name.trim(), otherNames: otherNames, type: type, description: description, apparentMagnitude: apparentMagnitude, uploader: foundUser, isPrivate: isPrivate });
        
        if (!isPrivate) {
            // Verify that the name is unique before making it publically saved
            const publicDuplicateCheck = await Objects.find({ name: new RegExp(`^${name.trim()}$`, 'i'), isPrivate: false });
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
        
        res.render("database", {types: currentTypes});

    } catch (e) {
        // Something went wrong
        console.log(`Encountered an error when viewing the database: ${e}`);

        res.redirect("/?error=An error happened when trying to connect to the database, contact an admin.");
        return;
    };
};

// Database - display all the personal objects of a user in Date order by default
exports.personal = async (req, res) => {
    try {        
        const currentTypes = await Type.find({});
        if (!currentTypes) {
            console.log("Couldn't find the types, they're not in the database!");
            res.redirect("/?error=Something went wrong with types, contact an admin");
            return;
        };
        
        res.render("userObjects", { types: currentTypes, message: req.query.message, error: req.query.error });

    } catch (e) {
        // Something went wrong
        console.log(`Encountered an error when viewing the database: ${e}`);

        res.redirect("/?error=An error happened when trying to connect to the database, contact an admin.");
        return;
    };
};

// View - view an object in the database
exports.view = async (req, res) => {
    const objectToFind = req.params.id;
    
    try {
        // Attempt to find the object and populate the type and uploader
        const foundObject = await Objects.findById(objectToFind)
            .populate("type", "name description")
            .populate({ path: "uploader", populate: { path: "rank", select: "colour" }, select: "username" });

        if (!foundObject) {
            console.log(`Couldn't find object ${objectToFind}`);
            res.render("404");
            return;
        };

        // If it's not public, we need to ensure the session user is the uploader
        if (foundObject.isPrivate && req.session.userID !== foundObject.uploader.id) {
            console.log(`User ID "${req.session.userID}" tried to access a private object`);
            res.render("404");
            return;
        };

        // Otherwise, it's safe to view the object
        const foundObjectUpdated = new Date(foundObject.updatedAt);
        const foundObjectNames = foundObject.otherNames.toString().replace(/,(?=[^\s])/g, ", ");

        res.render("viewObject", { object: foundObject, foundObjectUpdated: foundObjectUpdated.toDateString(), foundObjectNames: foundObjectNames});

    } catch (e) {
        // Something went wrong
        console.log(`Encountered an error when viewing object: ${e}`);

        res.redirect("/?error=An error happened when trying to view the object, contact an admin.");
        return;
    };
};

// Edit - edit an object based on the ID given
exports.editForm = async (req, res) => {
    const objectToEdit = req.params.id;
    
    try {
        // Attempt to find the object and populate the type and uploader
        const foundObject = await Objects.findById(objectToEdit)
            .populate("type", "name description")
            .populate({ path: "uploader", populate: { path: "rank", select: "colour" }, select: "username" });

        
        if (!foundObject) {
            console.log(`Couldn't find object ${objectToEdit}`);
            res.render("404");
            return;
        };

        // We need to ensure that the logged in user is editing their own object
        if (req.session.userID !== foundObject.uploader.id) {
            console.log(`User ID "${req.session.userID}" tried to access a private object`);
            res.render("404");
            return;
        };

        const foundObjectNames = foundObject.otherNames.toString().replace(/,(?=[^\s])/g, ", ");

        // Get all the types for easy type selection
        const currentTypes = await Type.find({});
        if (!currentTypes) {
            console.log("Couldn't find the types, they're not in the database!");
            res.redirect("/?error=Something went wrong with types, contact an admin");
            return;
        };

        res.render("editObject", { object: foundObject, foundObjectNames: foundObjectNames, types: currentTypes });

    } catch (e) {
        // Something went wrong
        console.log(`Encountered an error when editing object: ${e}`);

        res.redirect("/?error=An error happened when trying to view the object, contact an admin.");
        return;
    };
};

// Edit - attempt to edit an object
exports.edit = async (req, res) => {
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
        let objectId = req.body.objectId;
        let name = req.body.name;
        let type = req.body.type;
        let isPrivate = true;

        // Optional data
        let description = req.body.description;
        let otherNames = req.body.otherNames;
        let apparentMagnitude = req.body.apparentMagnitude;
        //let image = req.body.image;

        if (!objectId || !name || !type) {
            res.redirect(`/?error=Invalid entry.`);
            return;
        };

        // Find the object and then convert data similarly to our other queries     
        const editObject = await Objects.findById(objectId).populate("type", "rankScore").populate("uploader", "_id");
        if (!editObject || editObject.uploader.id !== req.session.userID) {
            res.redirect(`/?error=Invalid object ID, it might be deleted or you don't have permission to do this.`);
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
        if (req.body.otherNames && req.body.otherNames !== "" && req.body.otherNames !== "Not given") {
            let names = req.body.otherNames.replace(/\s/g,'');
            otherNames = names.split(",");
        } else {
            otherNames = "Not given";
        };

        // Convert data to the correct format (magnitude)
        if (req.body.apparentMagnitude !== "") {
            try {
                apparentMagnitude = parseFloat(req.body.apparentMagnitude);
            } catch (e) {
                res.redirect(`/?error=Invalid magnitude.`);
                return;
            };
        };

        // Convert data to the correct format (description)
        if (!req.body.description || req.body.description === "") {
            description = "Not given";
        } else {
            description = req.body.description.trim();
        };

        // Convert data to the correct format (image (png, gif, jpeg))

        // Firstly do a check if the object is going public before editing it and deciding the users rank
        if (!isPrivate) {
            const publicDuplicateCheck = await Objects.find({ _id: {$ne: objectId}, name: new RegExp(`^${name.trim()}$`, 'i'), isPrivate: false });
            if (publicDuplicateCheck.length > 0) {
                console.log(`Duplicate public object attempted to be made: ${name}`);
                res.redirect(`/?error=The object has already been publicly listed by another user.`);
                return;
            };
        };

        await Objects.updateOne(editObject, { name: name.trim(), otherNames: otherNames, type: type, description: description, apparentMagnitude: apparentMagnitude, uploader: foundUser, isPrivate: isPrivate }, { runValidators: true });

        // The user is making the object public, we need to rank them up by the FOUND type if the save goes through
        if (!isPrivate) {
            // Take away the current points, but ensure they don't fall below 0
            if (foundUser.rankScore - editObject.type.rankScore < 0) {
                await User.findByIdAndUpdate(foundUser.id, { rankScore: 0 });
            } else {
                await User.findByIdAndUpdate(foundUser.id, { $inc: { rankScore: -editObject.type.rankScore } });
            };

            const upgradeRank = await Rank.findOne({ rankScoreNeeded: { $lte: foundUser.rankScore + foundType.rankScore } }).sort({ rankScoreNeeded: -1 });

            if (upgradeRank.name === foundUser.rank.name) {
                await User.findByIdAndUpdate(foundUser.id, { $inc: { rankScore: foundType.rankScore } });
            } else {        
                console.log(`${foundUser.username} has leveled up to ${upgradeRank.name}`);
                await User.findByIdAndUpdate(foundUser.id, { $inc: { rankScore: foundType.rankScore }, rank: upgradeRank.id });
            };

        // The user is making the object private, we need to rank them down by the CURRENT type if the save goes through
        } else {
            const upgradeRank = await Rank.findOne({ rankScoreNeeded: { $lte: foundUser.rankScore - editObject.type.rankScore } }).sort({ rankScoreNeeded: -1 });

            if (upgradeRank.name === foundUser.rank.name) {
                await User.findByIdAndUpdate(foundUser.id, { $inc: { rankScore: -editObject.type.rankScore } });
            } else {        
                console.log(`${foundUser.username} has been deranked to ${upgradeRank.name}`);
                await User.findByIdAndUpdate(foundUser.id, { $inc: { rankScore: -editObject.type.rankScore }, rank: upgradeRank.id });
            };
        };

        console.log(`${req.body.name} has been edited`);
        res.redirect(`/object/view/${editObject.id}`);

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

// Delete - delete an object based on the ID given
exports.delete = async (req, res) => {
    try {
        // Firstly, ensure the user is deleting their own object
        const foundUser = await User.findById(req.session.userID);
        const foundObject = await Objects.findById(req.body.toDelete).populate("type", "rankScore").populate("uploader", "_id");

        if (!foundUser || !foundObject || foundUser.id !== foundObject.uploader.id) {
            console.log(`Couldn't delete object ${req.body.toDelete}`);
            res.redirect(`/my-objects/?error=Couldn't delete the object, it might already be deleted or you don't have access to do this.`);
            return;
        };

        // If the code reaches here, it's safe to delete the object
        await Objects.deleteOne(foundObject);

        // Decrement the users rank score and potentially derank them
        await User.updateOne(foundUser, { $pull: { createdObjects: foundObject.id } });

        if (!foundObject.isPrivate) {
            const upgradeRank = await Rank.findOne({ rankScoreNeeded: { $lte: foundUser.rankScore - foundObject.type.rankScore } }).sort({ rankScoreNeeded: -1 });

            if (upgradeRank.name === foundUser.rank.name) {
                await User.findByIdAndUpdate(foundUser.id, { $inc: { rankScore: -foundObject.type.rankScore } });
            } else {        
                console.log(`${foundUser.username} has been deranked to ${upgradeRank.name}`);
                await User.findByIdAndUpdate(foundUser.id, { $inc: { rankScore: -foundObject.type.rankScore }, rank: upgradeRank.id });
            };
        };

        console.log(`${foundObject.name} has been deleted`);
        res.redirect(`/my-objects/?message=The object has been deleted.`);

    } catch (e) {
        // Something went wrong
        console.log(`Encountered an error when delelting object: ${e}`);

        res.redirect(`/my-objects/?error=The object couldn't be deleted, it may already be gone.`);
        return;
    };
};