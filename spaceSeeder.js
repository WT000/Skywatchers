// Ordered by how likely a user will see one of these in the sky
const objectTypes = [
    {
        name: "Star",
        description: "A massive ball of hydrogen and helium, reaching temperatures which turn it into plasma.",
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
        name: "Planet",
        description: "Spherical objects made from rock, water, gas or ice which usually orbit a star.",
        rankScore: 1,
    },
    {
        name: "Moon",
        description: "Objects usually made from rock in orbit around a planet.",
        rankScore: 1,
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
        description: "The remnants of dead stars, common examples of such are white dwarfs, neutron stars, and stellar black holes.",
        rankScore: 3,
    },
    {
        name: "Supermassive Black Hole",
        description: "The gigantic black holes found at the core of galaxies.",
        rankScore: 10,
    },
    {
        name: "Other",
        description: "Something which doesn't match any of the given types.",
        rankScore: 0,
    },
];

// Ordered by rankScoreNeeded
const userRanks = [
    {
        name: "Newcomer",
        description: "This user has less than 10 rank score.",
        colour: "#d3d3d3",
        rankScoreNeeded: 0,
    },
    {
        name: "Scientist",
        description: "This user has 10 or more rank score, nice!",
        colour: "#41b2f0",
        rankScoreNeeded: 10,
    },
    {
        name: "Astronaut",
        description: "This user has 20 or more rank score, brilliant!",
        colour: "#4141f0",
        rankScoreNeeded: 20,
    },
    {
        name: "Robot",
        description: "This user has 40 or more rank score, amazing!",
        colour: "#f05b41",
        rankScoreNeeded: 40,
    },
    {
        name: "Alien",
        description: "This user 80 or more rank score, INCREDIBLE!",
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
        const types = await db.collection("objectTypes").find({}).count();
        const ranks = await db.collection("userRanks").find({}).count();

        // The database already exists, reset the collection(s)
        if (types || ranks) {
            if (types) {
                console.log("Clearing old object types...");
                await db.collection("objectTypes").drop();
            };
            if (ranks) {
                console.log("Clearing old user ranks...");
                await db.collection("userRanks").drop();
            };
            
            console.log("Clearing old users...");
            await db.collection("users").drop();

            console.log("Clearing old objects...");
            await db.collection("objects").drop();
        };

        console.log("Inserting object types into objectTypes collection...");
        await db.collection("objectTypes").insertMany(objectTypes);

        console.log("Inserting user ranks into userRanks collection...");
        await db.collection("userRanks").insertMany(userRanks);

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