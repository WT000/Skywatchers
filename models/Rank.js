const mongoose = require("mongoose");
const { Schema } = mongoose;

// User Ranks cannot be created by users, no timestamps or min max validation needed

const rankSchema = new Schema(
    /*
    name - The name of the rank
    description - A short description on how to get the rank
    colour - The colour given to usernames which have the rank
    rankScoreNeeded - The Rank Score needed to get the rank
    */
    {
        name: { type: String, required: [true, "Name is required"], unique: true },
        description: { type: String, required: [true, "Description is required"] },
        colour: { type: String, required: [true, "Colour is required"] },
        rankScoreNeeded: { type: Number, required: [true, "Rank Score needed is required"], unique: true },
    }
);

module.exports = mongoose.model("Rank", rankSchema);
