const mongoose = require("mongoose");
const { Schema } = mongoose;
const bcrypt = require("bcrypt");
const uniqueValidator = require("mongoose-unique-validator");

const userSchema = new Schema(
    /*
    username - The username of the user (used to login)
    email - The email of the user (which, in a developed build, could be used to send forgot password emails to)
    password - The HASHED password of the user
    createdObjects - The objects the user has discovered (Skywatcher's way of saying created)
    bio - A short user description
    rankScore - The current Rank Score of the user, of which goes up depending on what type of object they publicly release
    rank - The current UserRank of the user
    */
    {
        username: { type: String, required: [true, "Username is required"], unique: true, maxlength: [25, "Username too long"], uniqueCaseInsensitive: true },
        email: { type: String, required: [true, "Email is required"], unique: true, maxlength: [100, "Email too long"], match: [/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/, 'Invalid email format'], uniqueCaseInsensitive: true },
        password: { type: String, required: [true, "Password is required"], minlength: [8, "Password needs a minimum of 8 characters"] },
        createdObjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Object" }],
        bio: { type: String, maxlength: [150, "Bio too long"] },
        rankScore: { type: Number, required: [true, "Rank Score is required"] },
        rank: { type: mongoose.Schema.Types.ObjectId, ref: "Rank", required: [true, "User Rank is required"] },
    },
    { timestamps: true }
);

// Ensure passwords are hashed BEFORE saving the password
userSchema.pre("save", async function (next) {
    try {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (e) {
        throw Error("Something went wrong hashing the password");
    };
});

// Apply this plugin to handle validation errors in a better way and detect usernames with different case
userSchema.plugin(uniqueValidator, { message: "The {PATH} is taken and needs to be unique." });

// Numbers represent sort order
userSchema.index({ name: 1, email: -1 });
module.exports = mongoose.model("User", userSchema);
