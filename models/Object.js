const mongoose = require("mongoose");
const { Schema } = mongoose;

const objectSchema = new Schema(
    /*
    name - The name of the object - Not given a unique check as this will only be performed when making an object public, to ensure it's publicly unique (so people can keep unlimited personal objects and records) and not part of the Other category.
    otherNames - Other names given to the object
    type - What ObjectType the object is
    description - A short description on what the object is
    apparentMagnitude - The visibility of the object from Earth
    uploader - The uploader of the object
    isPrivate - Determines if the object should be shown on the front page or not
    imagePath - The path to the image of the object
    previewPath - The path to the image of the object which is used on the database / personal collection of the user
    */
    {
        name: { type: String, required: [true, "Name is required"], maxlength: [50, "Name too long"] },
        otherNames: [{ type: String, maxlength: [70, "Other Name too long"] }],
        type: { type: mongoose.Schema.Types.ObjectId, ref: "Type", required: [true, "Object Type is required"] },
        description: { type: String, maxlength: [400, "Description too long"] },
        apparentMagnitude: { type: Number },
        uploader: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: [true, "Uploader is required"] },
        isPrivate: { type: Boolean, required: [true, "isPrivate is required"] },
        imagePath: { type: String, required: [true, "imagePath is required"] },
        previewPath: { type: String, required: [true, "previewPath is required"] },
    },
    { timestamps: true }
);

// Index based on name
objectSchema.index({ name: "text" });
module.exports = mongoose.model("Object", objectSchema);
