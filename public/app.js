const locationInput = document.getElementById("locationInput");

const placeholders = [
    "📍 City, State or ZIP Code...",
    "🤘 ...or click the baby."
];

let currentPlaceholder = 0;

setInterval(() => {
    currentPlaceholder = (currentPlaceholder + 1) % placeholders.length;
    locationInput.placeholder = placeholders[currentPlaceholder];
}, 3000);


async function startSideQuest(type) {
    const location = document.getElementById("locationInput").value;

    if (type === "mystery") {
        const mysteryOptions = [
    "coffee",
    "food",
    "park",
    "thrift",
    "shopping",
    "art",
    "quirky",
    "nerd",
    "cheapfun",
    "datenight"
];

        type = mysteryOptions[Math.floor(Math.random() * mysteryOptions.length)];
    }

    if (!location) {
        alert("Please enter a location!");
        return;
    }

    document.getElementById("result").innerHTML = `
        <h2>🎲 Rolling your side quest...</h2>
    `;

const response = await fetch(
    `https://sidequest-q4tt.onrender.com/${type}?location=${encodeURIComponent(location)}`
);

const quest = await response.json();

if (!quest.name) {
    document.getElementById("result").innerHTML = `
        <div class="quest-card">

            <h2>🎲 Side Quest... NOT Accepted</h2>

            <img
    src="images/sad-dog.png"
    class="sad-dog"
    alt="Sad puppy"
>

<h2 class="error-title">
    We didn't find what you were looking for.
</h2>
            <p><em>Try something else.</em></p>

         <button onclick="startSideQuest('${type}')">
    🎲 Roll Again
</button>

<br><br>

<button onclick="location.reload()">
    ↺ Reset
</button>

        </div>
    `;

    return;
}
    const photoHtml = quest.photoUrl
        ? `<img class="place-photo" src="${quest.photoUrl}" alt="${quest.name}">`
        : "";

    document.getElementById("result").innerHTML = `
        <div class="quest-card">
            <h2>🎲 Side Quest Accepted</h2>
            ${photoHtml}

            <h3>${quest.quest}</h3>
            <h1>${quest.name}</h1>

            <p>${quest.address}</p>
            <p>⭐ ${quest.rating || "No rating yet"}</p>
            <p><em>${quest.mood || ""}</em></p>

            <a href="${quest.mapsLink}" target="_blank">
                Open in Google Maps
            </a>

            <br><br>

            <button onclick="startSideQuest('${type}')">
                Roll Again
            </button>
        </div>
    `;
}