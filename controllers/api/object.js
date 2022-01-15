const User = require("../../models/User");
const Rank = require("../../models/Rank");
const Objects = require("../../models/Object");
const Type = require("../../models/Type");
const errors = require(".././functions/get-errors.js");

exports.find = async (req, res) => {
    // Per page locked at 24, ensures nobody enters a ridiculous perPage number and slows down the system
    const perPage = 24;
    
    const nameToFind = req.query.objectName;
    const typeToFind = req.query.objectType;
    const sortBy = req.query.sortBy;
    const page = req.query.page;

    let finalType = undefined;
    let finalSort = undefined;
    
    // Ensure essential values are present
    if (!typeToFind || !page) {
        res.json({ errors: { query: { message: "Invalid query" }}, objects: {}});
        return;
    };
    
    try {
        // Prepare the type for the search
        if (typeToFind !== "All") {
            typeResult = await Type.findOne({ name: typeToFind });

            if (!typeResult) {
                res.json({ errors: { type: { message: "Invalid type" }, objects: {} } });
                return;
            };

            finalType = typeResult;
        } else {
            finalType = typeToFind;
        };

        // Prepare the sortBy for search
        // Looking for all objects in A-Z order
        if ((sortBy === "A-Z" && typeToFind === "All") || (sortBy === "A-Z" && typeToFind !== "" && nameToFind === "")) {
            finalSort = { name: 1 };
        
        // Looking for all objects in Date order
        } else if ((sortBy === "Date" && typeToFind === "All") || (sortBy === "Date" && typeToFind !== "" && nameToFind === "")) {
            finalSort = { updatedAt: -1 };
        
        // Looking for specific objects in A-Z order (priority given to textScore)
        } else if (sortBy === "A-Z") {
            finalSort = { score: { $meta: "textScore" }, name: 1 };

        // Looking for speicifc objects in date order (priority given to date)
        } else if (sortBy === "Date") {
            finalSort = { updatedAt: -1, score: { $meta: "textScore" }};
        
        // None of the valid options were given
        } else {
            res.json({ errors: { sortBy: { message: "Invalid sort" }, objects: {} } });
            return;
        };

        let queryResults = undefined;

        if (finalType === "All") {
            if (nameToFind) {
                // Search for the name under ALL types
                queryResults = await Objects.find(
                    { $text: { $search: nameToFind }, isPrivate: "false" },
                    { score: { $meta: "textScore" } }
                    ).populate("type", "name")
                    .populate({ path: "uploader", populate: { path: "rank", select: "colour" }, select: "username" })
                    .sort(finalSort).skip((page-1) * perPage).limit(perPage);
            } else {
                // Search for everything (no name provided)
                queryResults = await Objects.find({ isPrivate: "false" }
                ).populate("type", "name")
                .populate({ path: "uploader", populate: { path: "rank", select: "colour" }, select: "username" })
                .sort(finalSort).skip((page-1) * perPage).limit(perPage);
            }
            
        } else {
            if (nameToFind) {
                // Search for the name under the SPECIFIC type
                queryResults = await Objects.find(
                    { $text: { $search: nameToFind }, isPrivate: "false", type: finalType },
                    { score: { $meta: "textScore" } }
                    ).populate("type", "name")
                    .populate({ path: "uploader", populate: { path: "rank", select: "colour" }, select: "username" })
                    .sort(finalSort).skip((page-1) * perPage).limit(perPage);
            } else {
                // Search for everything under the SPECIFIC type (no name provided)
                queryResults = await Objects.find({ isPrivate: "false", type: finalType }
                ).populate("type", "name")
                .populate({ path: "uploader", populate: { path: "rank", select: "colour" }, select: "username" })
                .sort(finalSort).skip((page-1) * perPage).limit(perPage);
            }
        }
        
        res.json({ errors: {}, objects: queryResults });

    } catch (e) {
        console.log(e.message);
        // Something went wrong, the username or email may be taken / the password is too short
        if (e.code === 11000) {
            let internalErrors = errors.getErrors(e);

            res.json({ errors: internalErrors } );
            
        } else {
            res.json({ errors: e.errors });
        };
    };
};