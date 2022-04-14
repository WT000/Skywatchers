# Skywatchers
A web app powered by Node.js and MongoDB to track astronomical objects and show your findings to the world.

# KEY FEATURES
<ul>
    <li>Full CRUD operations on objects and users</li>
    <li>User authentication for create, update and delete operations (with a working Remember Me function)</li>
    <li>Rank Score system which rewards users for publicly discovering new objects</li>
    <li>AJAX form validation and API search system</li>
    <li>Image uploads for objects</li>
    <li>Visualised object statistics</li>
</ul>

# SETUP
If you wish to run the app on the production database, it's hosted online at [this URL](https://skywatchers.herokuapp.com/). However, for those who want to run the app locally, you can follow the steps below.

## General Setup
<ol>
    <li>Clone this repo</li>
    <li>Rename .env.example to .env and put your relevant URLs in the fields</li>
    <li>Use <i>npm install</i> in the directory containing package.json</li>
</ol>

You're now ready to run the application in development or production mode.

## Running in development mode
<ol>
    <li>Use <i>npm run seed</i> to setup the MONGODB_URI database</li>
    <li>Use <i>npm run dev</i> to run the app, it should be hosted at <a href="http://localhost:2020/">this URL</a>.</li>
</ol>

## Running in production mode
Ideally you should connect to [this URL](https://skywatchers.herokuapp.com/) or put your production database in MONGODB_URI, but if you wish to run it yourself:
<ol>
    <li>Use <i>npm run seedProduction</i> to setup the MONGODB_URI_PRODUCTION database</li>
    <li>Use <i>npm run production</i> to run the app, it should be hosted at <a href="http://localhost:2020/">this URL</a>.</li>
</ol>
