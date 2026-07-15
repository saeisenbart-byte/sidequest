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

const chainStoreWords = [
    "walmart",
    "target",
    "best buy",
    "kohl's",
    "kohls",
    "costco",
    "sam's club",
    "sams club",
    "dollar general",
    "family dollar",
    "dollar tree",
    "five below",
    "tj maxx",
    "t.j. maxx",
    "marshalls",
    "homegoods",
    "burlington",
    "macy's",
    "macys",
    "jcpenney",
    "belk",
    "old navy",
    "gap",
    "h&m",
    "forever 21",
    "michaels",
    "hobby lobby",
    "joann",
    "home depot",
    "lowe's",
    "lowes",
    "petsmart",
    "petco",
    "cvs",
    "walgreens"
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
            types: [],
            excludeChains: false
        };
    }

    return {
        keywords: search.keywords || "",
        types: search.types || [],
        excludeChains: search.excludeChains || false
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
        const name = place.displayName?.text?.toLowerCase() || "";

        const containsBannedWord = bannedWords.some(word =>
            name.includes(word)
        );

        const containsChainName =
            normalizedSearch.excludeChains &&
            chainStoreWords.some(word => name.includes(word));

        return !containsBannedWord && !containsChainName;
    });

    const availablePlaces = normalizedSearch.excludeChains
        ? filteredPlaces
        : (filteredPlaces.length ? filteredPlaces : places);

    const randomPlace = pickRandom(availablePlaces);

    if (!randomPlace) {
        throw new Error(
            "No places found. Try a nearby city or a different quest."
        );
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