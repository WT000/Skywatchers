const User = require("../../models/User");
const Rank = require("../../models/Rank");
const Objects = require("../../models/Object");
const Type = require("../../models/Type");
const errors = require(".././functions/get-errors.js");

exports.find = async (req, res) => {
    const perPage = 24;
    
    const nameToFind = req.query.objectName;
    const typeToFind = req.query.objectType;
    const page = req.query.page;

    let finalType = undefined;
    
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

        let queryResults = undefined;

        if (finalType === "All") {
            if (nameToFind) {
                // Search for the name under ALL types
                queryResults = await Objects.find(
                    { $text: { $search: nameToFind }, isPrivate: "false" },
                    { score: { $meta: "textScore" } }
                    ).populate("type", "name")
                    .populate({ path: "uploader", populate: { path: "rank", select: "colour" }, select: "username" })
                    .sort({ score: { $meta: "textScore" } }).skip((page-1) * perPage).limit(perPage);
            } else {
                // Search for everything (no name provided)
                queryResults = await Objects.find({ isPrivate: "false" }
                ).populate("type", "name")
                .populate({ path: "uploader", populate: { path: "rank", select: "colour" }, select: "username" })
                .sort({ name: 1 }).skip((page-1) * perPage).limit(perPage);
            }
            
        } else {
            if (nameToFind) {
                // Search for the name under the SPECIFIC type
                queryResults = await Objects.find(
                    { $text: { $search: nameToFind }, isPrivate: "false", type: finalType },
                    { score: { $meta: "textScore" } }
                    ).populate("type", "name")
                    .populate({ path: "uploader", populate: { path: "rank", select: "colour" }, select: "username" })
                    .sort({ score: { $meta: "textScore" } }).skip((page-1) * perPage).limit(perPage);
            } else {
                // Search for everything under the SPECIFIC type (no name provided)
                queryResults = await Objects.find({ isPrivate: "false", type: finalType }
                ).populate("type", "name")
                .populate({ path: "uploader", populate: { path: "rank", select: "colour" }, select: "username" })
                .sort({ name: 1 }).skip((page-1) * perPage).limit(perPage);
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