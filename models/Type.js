const mongoose = require("mongoose");
const { Schema } = mongoose;

// Object Types cannot be created by users, no timestamps or min max validation needed

const typeSchema = new Schema(
    /*
    name - The name of the type
    description - A short description on what the type is
    */
    {
        name: { type: String, required: [true, "Name is required"], unique: true },
        description: { type: String, required: [true, "Description is required"] },
    }
);

module.exports = mongoose.model("Type", typeSchema);
