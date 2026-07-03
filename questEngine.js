const geocodeLocation = require("./geocode");
const findPlaces = require("./places");

const bannedWords = [
    "apartment",
    "apartments",
    "condo",
    "condominium",
    "leasing",
    "real estate",
    "storage",
    "hotel",
    "motel"
];

const moodSetters = {
    default: [
        "Let's see where today leads.",
        "Adventure picked this one for you.",
        "A little discovery never hurts.",
        "This could be interesting."
    ]
};

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function normalizeSearch(search) {
    if (typeof search === "string" || Array.isArray(search)) {
        return {
            keywords: search,
            types: []
        };
    }

    return {
        keywords: search.keywords || "",
        types: search.types || []
    };
}

function chooseKeyword(keywords) {
    if (Array.isArray(keywords)) {
        return pickRandom(keywords);
    }

    return keywords;
}

function getMoodSetter() {
    return pickRandom(moodSetters.default);
}

function getPhotoUrl(place, apiKey) {
    if (!place.photos || place.photos.length === 0) {
        return null;
    }

    return `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxWidthPx=800&key=${apiKey}`;
}

async function startQuest(location, search, apiKey) {
    const normalizedSearch = normalizeSearch(search);
    const finalSearchText = chooseKeyword(normalizedSearch.keywords);

    const coordinates = await geocodeLocation(location, apiKey);

    const places = await findPlaces(
        coordinates.latitude,
        coordinates.longitude,
        finalSearchText,
        apiKey,
        normalizedSearch.types
    );

    const filteredPlaces = places.filter(place => {
        const name = place.displayName.text.toLowerCase();

        return !bannedWords.some(word =>
            name.includes(word)
        );
    });

    const randomPlace = pickRandom(
        filteredPlaces.length ? filteredPlaces : places
    );

    if (!randomPlace) {
        throw new Error("No places found. Try a nearby city or a different quest.");
    }

    return {
        quest: finalSearchText,
        name: randomPlace.displayName.text,
        address: randomPlace.formattedAddress,
        rating: randomPlace.rating,
        mapsLink: randomPlace.googleMapsUri,
        photoUrl: getPhotoUrl(randomPlace, apiKey),
        mood: getMoodSetter()
    };
}

module.exports = startQuest;