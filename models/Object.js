const mongoose = require("mongoose");
const { Schema } = mongoose;

const objectSchema = new Schema(
    /*
    name - The name of the object - Not given a unique check as this will only be performed when making an object public (to ensure people can keep personal objects)
    otherNames - Other names given to the object
    type - What ObjectType the object is
    description - A short description on what the object is
    apparentMagnitude - The visibility of the object from Earth
    uploader - The uploader of the object
    isPrivate - Determines if the object should be shown on the front page or not
    imagePath - The path to the image of the object
    */
    {
        name: { type: String, required: [true, "Name is required"], maxlength: [50, "Name too long"] },
        otherNames: [{ type: String, unique: true, maxlength: [50, "Other Name too long"] }],
        type: { type: mongoose.Schema.Types.ObjectId, ref: "ObjectType", required: [true, "Object Type is required"] },
        description: { type: String, maxlength: [100, "Description too long"] },
        apparentMagnitude: { type: Number },
        uploader: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: [true, "Uploader is required"] },
        isPrivate: { type: Boolean },
        imagePath: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Object", objectSchema);
