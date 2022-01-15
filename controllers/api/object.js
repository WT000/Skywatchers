const User = require("../../models/User");
const Rank = require("../../models/Rank");
const Objects = require("../../models/Object");
const Type = require("../../models/Type");

exports.find = async (req, res) => {
    // Get the raw values, then prepare to convert them into proper ones
    
    const nameToFind = req.query.objectName;
    const typeToFind = req.query.objectType;
    const sortBy = req.query.sortBy;
    const page = req.query.page;
    const perPage = req.query.perPage;

    let finalType;
    let finalSort;
    let finalPage;
    let finalPerPage;
    
    // Ensure essential values are present
    if (nameToFind == undefined || !typeToFind || !sortBy || !page || !perPage) {
        res.json({ errors: { query: { message: "Invalid query" }}, objects: {}, numObjects: 0});
        return;
    };
    
    try {
        // Prepare the type for the search
        if (typeToFind !== "All") {
            typeResult = await Type.findOne({ name: typeToFind });

            if (!typeResult) {
                res.json({ errors: { type: { message: "Invalid type" }, objects: {}, numObjects: 0 } });
                return;
            };

            finalType = typeResult;
        } else {
            finalType = typeToFind;
        };

        // Prepare the sortBy for search
        // Looking for all objects in A-Z order / all objects in a specific type in A-Z order
        if ((sortBy === "A-Z" && typeToFind === "All") || (sortBy === "A-Z" && typeToFind !== "" && nameToFind === "")) {
            finalSort = { name: 1 };
        
        // Looking for all objects in Date order / all objects in a specific type in Date order
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
            res.json({ errors: { sortBy: { message: "Invalid sort" }, objects: {}, numObjects: 0 } });
            return;
        };

        // Ensure page and perPage are numbers (will fail if they're not)
        finalPage = Math.floor(page);
        finalPerPage = Math.floor(perPage);

        if (isNaN(finalPerPage) || isNaN(finalPage)) {
            res.json({ errors: { page: { message: "Invalid perPage or page (must be a whole number)" }, objects: {}, numObjects: 0 } });
            return;
        } else if (finalPerPage < 1 || finalPage < 1) {
            res.json({ errors: { page: { message: "Invalid perPage or page (must be a positive number greater than 0)" }, objects: {}, numObjects: 0 } });
            return;
        } else if (!Number.isSafeInteger(finalPage) || !Number.isSafeInteger(finalPerPage) || !Number.isSafeInteger((finalPage-1) * finalPerPage)) {
            res.json({ errors: { page: { message: "Invalid perPage or page number (lower the numbers)" }, objects: {}, numObjects: 0 } });
            return;
        };

        let queryResults;
        let objectCount;

        if (finalType === "All") {
            if (nameToFind) {
                // Search for the name under ALL types
                queryResults = await Objects.find(
                    { $text: { $search: nameToFind }, isPrivate: "false" },
                    { score: { $meta: "textScore" } }
                    ).populate("type", "name")
                    .populate({ path: "uploader", populate: { path: "rank", select: "colour" }, select: "username" })
                    .sort(finalSort).skip((finalPage-1) * finalPerPage).limit(finalPerPage);
                
                objectCount = await Objects.find({
                    $text: { $search: nameToFind },
                    isPrivate: "false"}, { score: { $meta: "textScore" } }).count();
                
            } else {
                // Search for everything (no name provided)
                queryResults = await Objects.find({ isPrivate: "false" }
                ).populate("type", "name")
                .populate({ path: "uploader", populate: { path: "rank", select: "colour" }, select: "username" })
                .sort(finalSort).skip((finalPage-1) * finalPerPage).limit(finalPerPage);
                
                objectCount = await Objects.find({ isPrivate: "false" }).count();

            }
            
        } else {
            if (nameToFind) {
                // Search for the name under the SPECIFIC type
                queryResults = await Objects.find(
                    { $text: { $search: nameToFind }, isPrivate: "false", type: finalType },
                    { score: { $meta: "textScore" } }
                    ).populate("type", "name")
                    .populate({ path: "uploader", populate: { path: "rank", select: "colour" }, select: "username" })
                    .sort(finalSort).skip((finalPage - 1) * finalPerPage).limit(finalPerPage);
                
                objectCount = await Objects.find({
                    $text: { $search: nameToFind },
                    isPrivate: "false", type: finalType}, { score: { $meta: "textScore" } }).count();

            } else {
                // Search for everything under the SPECIFIC type (no name provided)
                queryResults = await Objects.find({ isPrivate: "false", type: finalType }
                ).populate("type", "name")
                .populate({ path: "uploader", populate: { path: "rank", select: "colour" }, select: "username" })
                .sort(finalSort).skip((finalPage - 1) * finalPerPage).limit(finalPerPage);
                
                objectCount = await Objects.find({ isPrivate: "false", type: finalType }).count();
            }
        }
        
        res.json({ errors: {}, objects: queryResults, numObjects: objectCount });

    } catch (e) {
        console.log(e.message);
        res.json({ errors: e.errors });
    };
};