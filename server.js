const express = require("express");
const cors = require("cors");
require("dotenv").config();

const createQuestRoute = require("./questRoute");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.send("Side Quest Generator server is running! 🎲");
});

app.get("/apikey", (req, res) => {
    res.send(
        process.env.GOOGLE_API_KEY
            ? "API Key Loaded ✅"
            : "API Key Missing ❌"
    );
});

// Simple geocode test route
app.get("/adventure", async (req, res) => {
    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${req.query.location}&key=${process.env.GOOGLE_API_KEY}`
        );

        const data = await response.json();

        res.json({
            city: data.results[0].address_components[1].long_name,
            latitude: data.results[0].geometry.location.lat,
            longitude: data.results[0].geometry.location.lng
        });
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

// Every quest lives here
const quests = [
    {
        route: "coffee",
        search: {
            keywords: [
                "coffee shop",
                "cafe",
                "espresso bar",
                "coffee roaster",
                "local coffee shop"
            ],
            types: ["cafe"]
        },
        title: "☕ Coffee Quest"
    },
    {
        route: "food",
        search: {
            keywords: [
                "restaurant",
                "local restaurant",
                "diner",
                "pizza",
                "tacos",
                "ramen",
                "barbecue",
                "food truck"
            ],
            types: ["restaurant"]
        },
        title: "🍔 Food Roulette"
    },
    {
        route: "park",
        search: {
            keywords: [
                "park",
                "nature preserve",
                "walking trail",
                "botanical garden",
                "riverwalk",
                "state park"
            ],
            types: ["park"]
        },
        title: "🌳 Touch Grass"
    },
    {
        route: "thrift",
        search: {
            keywords: [
                "thrift store",
                "Goodwill",
                "Goodwill Store",
                "The Salvation Army",
                "Savers",
                "vintage store",
                "consignment shop",
                "antique store",
                "antique mall",
                "flea market"
            ],
            types: ["store"]
        },
        title: "🛍️ Thrift Hunt"
    },
    {
        route: "shopping",
        search: {
            keywords: [
                "local boutique",
                "independent boutique",
                "local gift shop",
                "independent gift shop",
                "local clothing store",
                "independent toy store",
                "local craft store",
                "local home decor shop",
                "locally owned shop",
                "small business shopping"
            ],
            types: ["store"],
            excludeChains: true
        },
        title: "🛒 Shopping"
    },
    {
        route: "art",
        search: {
            keywords: [
                "art gallery",
                "art museum",
                "public art",
                "mural",
                "sculpture garden",
                "art center"
            ],
            types: ["art_gallery"]
        },
        title: "🎨 Hidden Art"
    },
    {
        route: "quirky",
        search: {
            keywords: [
                "unique attractions",
                "roadside attraction",
                "oddities museum",
                "historic landmark",
                "sculpture park",
                "observation tower"
            ],
            types: ["tourist_attraction"]
        },
        title: "🦆 Quirky Finds"
    },
    {
        route: "nerd",
        search: {
            keywords: [
                "comic book store",
                "used bookstore",
                "board game store",
                "retro arcade",
                "record store",
                "game store",
                "hobby shop",
                "tabletop games"
            ],
            types: ["book_store"]
        },
        title: "📚 Nerd Mode"
    },
    {
        route: "cheapfun",
        search: {
            keywords: [
                "public library",
                "free museum",
                "free attraction",
                "botanical garden",
                "walking trail",
                "public park",
                "farmers market",
                "nature preserve",
                "visitor center",
                "historic site",
                "community event",
                "free things to do"
            ],
            types: ["library"]
        },
        title: "💸 Cheap Fun"
    },
    {
        route: "datenight",
        search: {
            keywords: [
                "romantic restaurant",
                "dessert cafe",
                "wine bar",
                "rooftop restaurant",
                "date night restaurant",
                "botanical garden"
            ],
            types: ["restaurant"]
        },
        title: "❤️ Date Night"
    }
];

quests.forEach((quest) => {
    app.get(
        `/${quest.route}`,
        createQuestRoute(
            quest.search,
            quest.title
        )
    );
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});