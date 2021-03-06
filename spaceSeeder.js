// Ordered by how likely an astronomer will see one of these in the sky when looking through a telescope
const typesInsert = [
    {
        name: "Star",
        description: "Massive objects of hydrogen and helium, reaching temperatures which turn it into plasma.",
        rankScore: 1,
    },
    {
        name: "Planet",
        description: "Spherical objects made from rock, water, gas or ice which usually orbit a star.",
        rankScore: 2,
    },
    {
        name: "Moon",
        description: "Objects usually made from rock in orbit around a planet.",
        rankScore: 1,
    },
    {
        name: "Nebula",
        description: "Beautiful clouds of gas, some of which are formed from dying stars.",
        rankScore: 2,
    },
    {
        name: "Galaxy",
        description: "Huge collections of stars ranging from dwarf galaxies to giant elliptical galaxies.",
        rankScore: 3,
    },
    {
        name: "Dwarf Planet",
        description: "Moon-sized objects which aren't big enough to be considered a planet.",
        rankScore: 1,
    },
    {
        name: "Comet",
        description: "Objects made from dust and ice, revealing a tail due to the heat of a star.",
        rankScore: 2,
    },
    {
        name: "Asteroid",
        description: "Small, rocky objects which are common between the orbits of Mars and Jupiter.",
        rankScore: 1,
    },
    {
        name: "Stellar Remnant",
        description: "Remnants of dead stars such as white dwarfs, neutron stars, and stellar black holes.",
        rankScore: 3,
    },
    {
        name: "Supermassive Black Hole",
        description: "Gigantic black holes found at the core of galaxies.",
        rankScore: 10,
    },
    {
        name: "Other",
        description: "Something which doesn't match any of the given types.",
        rankScore: 0,
    },
];

// Ordered by rankScoreNeeded
const ranksInsert = [
    {
        name: "Newcomer",
        description: "Less than 10 Rank Score.",
        colour: "#d3d3d3",
        rankScoreNeeded: 0,
    },
    {
        name: "Scientist",
        description: "10 or more Rank Score.",
        colour: "#41b2f0",
        rankScoreNeeded: 10,
    },
    {
        name: "Astronaut",
        description: "20 or more Rank Score.",
        colour: "#4141f0",
        rankScoreNeeded: 20,
    },
    {
        name: "Robot",
        description: "40 or more Rank Score.",
        colour: "#f05b41",
        rankScoreNeeded: 40,
    },
    {
        name: "Alien",
        description: "80 or more Rank Score.",
        colour: "#76f041",
        rankScoreNeeded: 80,
    },
];

// Setup the connection to MongoDB and environment variables
const { MongoClient } = require("mongodb");
require("dotenv").config();

const { MONGODB_URI, MONGODB_URI_PRODUCTION } = process.env;
// Now we can tell which mode we're running in (if production URI_PRODUCTION, else MONGODB_URI)
const client = new MongoClient(
    process.env.NODE_ENV === "production" ? MONGODB_URI_PRODUCTION : MONGODB_URI
);

async function main() {
    try {
        // Attempt to connect to the database and find if it's already populated
        await client.connect();
        const db = client.db();
        
        // Strangely dropping the entire database at once sometimes runs into an error, 
        // so collections are dropped individually to ensure this doesn't happen
        const types = await db.collection("types").find({}).count();
        const ranks = await db.collection("ranks").find({}).count();

        // The database already exists, reset the collection(s)
        if (types || ranks) {
            console.log("Clearing old types...");
            await db.collection("types").drop();
            

            console.log("Clearing old ranks...");
            await db.collection("ranks").drop();


            console.log("Clearing old users...");
            await db.collection("users").drop();


            console.log("Clearing old objects...");
            await db.collection("objects").drop();
        };

        console.log("Inserting types into the types collection...");
        await db.collection("types").insertMany(typesInsert);

        console.log("Inserting ranks into the ranks collection...");
        await db.collection("ranks").insertMany(ranksInsert);

        console.log("Creating users collection...")
        await db.createCollection("users");

        console.log("Creating objects collection...");
        await db.createCollection("objects");

        console.log("Database ready!");
        process.exit();

    } catch (e) {
        // An error occurred...
        console.error("Encountered an error: ", e)
        process.exit();
    }
}

main();
