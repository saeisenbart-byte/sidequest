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
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(req.query.location)}&key=${process.env.GOOGLE_API_KEY}`
        );

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            return res.status(404).json({
                error: "Location not found."
            });
        }

        res.json({
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
                "community garden",
                "garden",
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
                "The Salvation Army",
                "Savers",
                "Habitat for Humanity ReStore",
                "Habitat ReStore",
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
                "gift shop",
                "locally owned gift shop",
                "artisan market",
                "maker market",
                "handmade shop",
                "craft store",
                "vintage clothing",
                "antique shop",
                "record store",
                "comic book store",
                "used bookstore",
                "independent bookstore",
                "toy store",
                "plant shop",
                "home decor boutique",
                "stationery store",
                "art supply store",
                "locally owned shop"
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
                "comics",
                "used bookstore",
                "board game store",
                "retro arcade",
                "record store",
                "vinyl records",
                "game store",
                "hobby shop",
                "tabletop games"
            ],
            types: []
        },
        title: "📚 Nerd Mode"
    },
    {
        route: "breakfast",
        search: {
            keywords: [
                "breakfast restaurant",
                "local breakfast",
                "brunch restaurant",
                "breakfast cafe",
                "pancake restaurant"
            ],
            types: ["restaurant"]
        },
        title: "🍳 Breakfast"
    },
    {
        route: "lunch",
        search: {
            keywords: [
                "lunch restaurant",
                "local lunch",
                "sandwich shop",
                "casual lunch restaurant",
                "cafe lunch"
            ],
            types: ["restaurant"]
        },
        title: "🥪 Lunch"
    },
    {
        route: "dinner",
        search: {
            keywords: [
                "dinner restaurant",
                "local dinner restaurant",
                "casual dinner",
                "popular local restaurant"
            ],
            types: ["restaurant"]
        },
        title: "🍽️ Dinner"
    },
    {
        route: "dessert",
        search: {
            keywords: [
                "dessert shop",
                "ice cream shop",
                "bakery",
                "cupcake shop",
                "local dessert cafe"
            ],
            types: []
        },
        title: "🍰 Dessert"
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
                "free things to do",
                "Dave & Buster's",
                "arcade",
                "city forum",
                "inexpensive things to do"
            ],
            types: []
        },
        title: "💸 Cheap Fun"
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
    console.log(`Server running on port ${PORT}`);
});