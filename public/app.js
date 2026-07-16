window.onerror = function (message, source, line, column) {
    alert(
        `JavaScript error:\n${message}\nLine ${line}, column ${column}`
    );
};


const locationInput = document.getElementById("locationInput");

const placeholders = [
    "📍 City, State or ZIP Code...",
    "🤘 ...or click the baby."
];

let currentPlaceholder = 0;

setInterval(() => {
    currentPlaceholder =
        (currentPlaceholder + 1) % placeholders.length;

    locationInput.placeholder =
        placeholders[currentPlaceholder];
}, 3000);


const loadingMessages = [
    "Consulting the quest board...",
    "Consulting the wizard...",
    "Pondering the orb...",
    "Looking nearby...",
    "Following rumors...",
    "Dusting off the map...",
    "Reading the ancient scrolls...",
    "Checking the stars...",
    "Avoiding boring places...",
    "Searching for hidden gems...",
    "Rolling the dice...",
    "Asking the tavern keeper...",
    "Deciphering mysterious runes...",
    "Almost there..."
];


function wait(milliseconds) {
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}


/* ---------------- SCREEN NAVIGATION ---------------- */

function showScreen(screenId) {
    document.querySelectorAll(".app-screen").forEach(screen => {
        screen.classList.remove("active-screen");
    });

    const selectedScreen = document.getElementById(screenId);

    if (selectedScreen) {
        selectedScreen.classList.add("active-screen");
    }

    window.scrollTo(0, 0);
}


function showHomeScreen() {
    showScreen("homeScreen");
}


function openPlanMyDay() {
    const savedAdventure =
        localStorage.getItem("activeSideQuestAdventure");

    if (savedAdventure) {
        document
            .getElementById("resumeModal")
            .classList.remove("hidden");

        return;
    }

    showScreen("planSetupScreen");
}


function openAdventureJournal() {
    showScreen("journalScreen");
    renderAdventureJournal();
}


/* ---------------- PLAN MY DAY ---------------- */

const activityQuestTypes = [
    "park",
    "thrift",
    "shopping",
    "art",
    "quirky",
    "nerd",
    "cheapfun"
];

const foodOrder = [
    "breakfast",
    "coffee",
    "lunch",
    "dinner",
    "dessert"
];


function shuffleList(list) {
    const shuffled = [...list];

    for (let index = shuffled.length - 1; index > 0; index--) {
        const randomIndex =
            Math.floor(Math.random() * (index + 1));

        [
            shuffled[index],
            shuffled[randomIndex]
        ] = [
            shuffled[randomIndex],
            shuffled[index]
        ];
    }

    return shuffled;
}
function createItineraryTypes(dayLength, selectedFood) {
    const chosenFood = foodOrder.filter(type =>
        selectedFood.includes(type)
    );

    let activityCount;

    if (dayLength === "quarter") {
        activityCount = Math.max(
            1,
            3 - chosenFood.length
        );
    } else if (dayLength === "half") {
        activityCount = Math.max(
            1,
            4 - chosenFood.length
        );
    } else {
        // Whole Day:
        // 2 activities if dessert is selected
        // 3 activities if dessert is not selected
        activityCount = chosenFood.includes("dessert")
            ? 2
            : 3;
    }

    const activities =
        shuffleList(activityQuestTypes)
            .slice(0, activityCount);

    const itinerary = [];

    if (chosenFood.includes("breakfast")) {
        itinerary.push("breakfast");
    }

    if (chosenFood.includes("coffee")) {
        itinerary.push("coffee");
    }

    if (activities.length) {
        itinerary.push(activities.shift());
    }

    if (chosenFood.includes("lunch")) {
        itinerary.push("lunch");
    }

    if (activities.length) {
        itinerary.push(activities.shift());
    }

    if (chosenFood.includes("dinner")) {
        itinerary.push("dinner");
    }

    if (chosenFood.includes("dessert")) {
        itinerary.push("dessert");
    }

    itinerary.push(...activities);

    return itinerary;
}
   

function resetPlanSelections() {
    document.querySelectorAll(
        'input[name="meal"]'
    ).forEach(input => {
        input.checked = false;
    });

    const quarterDay =
        document.querySelector(
            'input[name="dayLength"][value="quarter"]'
        );

    if (quarterDay) {
        quarterDay.checked = true;
    }
}


async function fetchQuestForPlan(type, location) {
    const response = await fetch(
        `https://sidequest-q4tt.onrender.com/${type}?location=${encodeURIComponent(location)}`
    );

    if (!response.ok) {
        throw new Error(
            `Could not generate the ${type} stop.`
        );
    }

    const quest = await response.json();

    if (!quest.name) {
        throw new Error(
            `No place was found for ${type}.`
        );
    }

    return {
        id:
            `${Date.now()}-${type}-${Math.random()}`,
        type,
        quest: quest.quest,
        name: quest.name,
        address: quest.address,
        rating: quest.rating,
        mapsLink: quest.mapsLink,
        photoUrl: quest.photoUrl,
        completed: false,
        skipped: false
    };
}


async function buildMyAdventure() {
    const selectedLength =
        document.querySelector(
            'input[name="dayLength"]:checked'
        )?.value || "quarter";

    const selectedFood = Array.from(
        document.querySelectorAll(
            'input[name="meal"]:checked'
        )
    ).map(input => input.value);

    const location = await getLocation();

    if (!location) {
        return;
    }

    showScreen("itineraryScreen");

    document.getElementById("itineraryList").innerHTML = `
        <div class="quest-card loading-card">
            <h2>✨ Building your adventure...</h2>
            <div
                id="loadingText"
                class="loading-text"
            ></div>
        </div>
    `;

    const loadingState = {
        active: true
    };

    const loadingAnimation =
        playLoadingAnimation(loadingState);

    try {
        const itineraryTypes =
            createItineraryTypes(
                selectedLength,
                selectedFood
            );

        const stops = [];

        // Fetch one at a time to avoid hammering the API.
        for (const type of itineraryTypes) {
            const stop =
                await fetchQuestForPlan(
                    type,
                    location
                );

            stops.push(stop);
        }

        const adventure = {
            id: `adventure-${Date.now()}`,
            createdAt: new Date().toISOString(),
            date: new Date().toLocaleDateString(),
            dayLength: selectedLength,
            location,
            completed: false,
            stops
        };

        localStorage.setItem(
            "activeSideQuestAdventure",
            JSON.stringify(adventure)
        );

        loadingState.active = false;
        await loadingAnimation;

        renderItinerary(adventure);

    } catch (error) {
        loadingState.active = false;
        await loadingAnimation;

        console.error(
            "Plan My Day error:",
            error
        );

        document.getElementById(
            "itineraryList"
        ).innerHTML = `
            <div class="quest-card">
                <h2>
                    We couldn't build your adventure.
                </h2>

                <p>
                    ${error.message}
                </p>

                <button onclick="showScreen('planSetupScreen')">
                    Try Again
                </button>
            </div>
        `;
    }
}

function continueAdventure() {
    document
        .getElementById("resumeModal")
        .classList.add("hidden");

    showScreen("itineraryScreen");

    const savedAdventure =
        localStorage.getItem("activeSideQuestAdventure");

    if (savedAdventure) {
        renderItinerary(JSON.parse(savedAdventure));
    }
}


function discardAdventure() {
    localStorage.removeItem("activeSideQuestAdventure");

    document
        .getElementById("resumeModal")
        .classList.add("hidden");

    showScreen("planSetupScreen");
}


function confirmGenerateAgain() {
    document
        .getElementById("replaceModal")
        .classList.remove("hidden");
}


function closeReplaceModal() {
    document
        .getElementById("replaceModal")
        .classList.add("hidden");
}


function generateNewAdventure() {
    localStorage.removeItem(
        "activeSideQuestAdventure"
    );

    closeReplaceModal();
    resetPlanSelections();
    showScreen("planSetupScreen");
}


function closeCompleteModal() {
    document
        .getElementById("completeModal")
        .classList.add("hidden");
}


async function sharePlan() {
    const savedAdventure =
        localStorage.getItem(
            "activeSideQuestAdventure"
        );

    if (!savedAdventure) {
        alert("There is no active adventure to share.");
        return;
    }

    const adventure =
        JSON.parse(savedAdventure);

    const stopsText = adventure.stops
        .map(stop => {
            const status = stop.skipped
                ? "🚫 Skipped"
                : stop.completed
                    ? "✅ Completed"
                    : "⬜ Planned";

            return [
                `${stop.quest}`,
                `${stop.name}`,
                `${stop.address}`,
                `${status}`,
                stop.mapsLink || ""
            ].filter(Boolean).join("\n");
        })
        .join("\n\n");

    const shareText = [
        "🎲 My Side Quest Adventure",
        "",
        stopsText,
        "",
        "Created with Side Quest 🎲"
    ].join("\n");

    try {
        if (navigator.share) {
            await navigator.share({
                title: "My Side Quest Adventure",
                text: shareText
            });

            return;
        }

        await navigator.clipboard.writeText(
            shareText
        );

        alert(
            "Your adventure was copied to the clipboard."
        );

    } catch (error) {
        if (error.name === "AbortError") {
            return;
        }

        console.error(
            "Share error:",
            error
        );

        alert(
            "We couldn't open sharing right now."
        );
    }
}


function renderItinerary(adventure) {
    const itineraryList =
        document.getElementById("itineraryList");

    if (!itineraryList) {
        return;
    }

    itineraryList.innerHTML =
        adventure.stops.map((stop, index) => {
            const stopClasses = [
                "itinerary-stop",
                stop.completed ? "completed" : "",
                stop.skipped ? "skipped" : ""
            ].filter(Boolean).join(" ");

            let controlsHtml = "";

            if (stop.skipped) {
                controlsHtml = `
                    <p class="stop-status">
                        🚫 Skipped
                    </p>
                `;
            } else {
                controlsHtml = `
                    <div class="stop-controls">
           <button
    class="complete-stop-button"
    onclick="toggleItineraryStop(
        ${index},
        ${stop.completed ? "false" : "true"}
    )"
>
    ${stop.completed
        ? "✅ Completed"
        : "✅ Mark Complete"}
</button>

                        ${
                            stop.completed
                                ? ""
                                : `
                                    <button
                                        class="skip-quest-button"
                                        onclick="skipItineraryStop(${index})"
                                    >
                                        🚫 Skip
                                    </button>
                                `
                        }
                    </div>
                `;
            }

            return `
                <div
                    class="${stopClasses}"
                    data-stop-index="${index}"
                >
                    <div class="stop-details">
                        <h3>${stop.quest}</h3>
                        <h2>${stop.name}</h2>

                        <p>${stop.address}</p>

                        <p>
                            ⭐ ${stop.rating || "No rating yet"}
                        </p>

                        <a
                            class="stop-map-link"
                            href="${stop.mapsLink}"
                            target="_blank"
                        >
                            📍 Open in Maps
                        </a>

                        ${controlsHtml}
                    </div>
                </div>
            `;
        }).join("");

    updateAdventureProgress(adventure);
    renderAdventureJournal();
}
function toggleItineraryStop(index, checked) {
    const savedAdventure =
        localStorage.getItem(
            "activeSideQuestAdventure"
        );

    if (!savedAdventure) {
        return;
    }

    const adventure =
        JSON.parse(savedAdventure);

    const stop = adventure.stops[index];

    if (!stop || stop.skipped) {
        return;
    }

    stop.completed = checked;

    saveActiveAdventure(adventure);
    renderItinerary(adventure);
    checkAdventureFinished(adventure);
}

function skipItineraryStop(index) {
    const savedAdventure =
        localStorage.getItem(
            "activeSideQuestAdventure"
        );

    if (!savedAdventure) {
        return;
    }

    const adventure =
        JSON.parse(savedAdventure);

    const stop = adventure.stops[index];

    if (!stop || stop.completed || stop.skipped) {
        return;
    }

    const shouldSkip = window.confirm(
        "Skip this quest?\n\n" +
        "It will count as skipped, and you can still complete your adventure."
    );

    if (!shouldSkip) {
        return;
    }

    stop.skipped = true;
    stop.completed = false;

    saveActiveAdventure(adventure);
    renderItinerary(adventure);
    checkAdventureFinished(adventure);
}

function saveActiveAdventure(adventure) {
    localStorage.setItem(
        "activeSideQuestAdventure",
        JSON.stringify(adventure)
    );
}


function updateAdventureProgress(adventure) {
    const total = adventure.stops.length;

    const completed = adventure.stops.filter(
        stop => stop.completed
    ).length;

    const skipped = adventure.stops.filter(
        stop => stop.skipped
    ).length;

    const remaining =
        total - completed - skipped;

    updateProgress(
        completed,
        skipped,
        remaining,
        total
    );
}


function checkAdventureFinished(adventure) {
    const remaining = adventure.stops.filter(
        stop => !stop.completed && !stop.skipped
    ).length;

    if (remaining === 0) {
        completeAdventure(adventure);
    }
}


function completeAdventure(adventure) {
    const journal =
        JSON.parse(
            localStorage.getItem(
                "sideQuestAdventureJournal"
            ) || "[]"
        );

    const alreadySaved =
        journal.some(entry =>
            entry.id === adventure.id
        );

    if (!alreadySaved) {
        const completedAdventure = {
            ...adventure,
            completed: true,
            completedAt:
                new Date().toISOString()
        };

        journal.unshift(
            completedAdventure
        );

        localStorage.setItem(
            "sideQuestAdventureJournal",
            JSON.stringify(journal)
        );
    }
renderAdventureJournal();
    localStorage.removeItem(
        "activeSideQuestAdventure"
    );

    document
        .getElementById("completeModal")
        .classList.remove("hidden");
}


function updateProgress(
    completed,
    skipped,
    remaining,
    total
) {
    const progressText =
        document.getElementById("progressText");

    const progressFill =
        document.getElementById("progressFill");

    const finished =
        completed + skipped;

    const percentage =
        total > 0
            ? Math.round(
                (finished / total) * 100
            )
            : 0;

    if (progressText) {
        progressText.innerHTML = `
            Completed: ${completed}<br>
            Skipped: ${skipped}<br>
            Remaining: ${remaining}
        `;
    }

    if (progressFill) {
        progressFill.style.width =
            `${percentage}%`;
    }
}

/* ---------------- ADVENTURE JOURNAL ---------------- */

function renderAdventureJournal() {
    const journalList =
        document.getElementById("journalList");

    const savedJournal =
        JSON.parse(
            localStorage.getItem(
                "sideQuestAdventureJournal"
            ) || "[]"
        );

    if (!journalList) {
        return;
    }

    if (savedJournal.length === 0) {
        journalList.innerHTML = `
            <div class="journal-empty-card">
                <p>
                    No completed adventures yet.
                </p>
            </div>
        `;

        return;
    }

    journalList.innerHTML =
        savedJournal.map((adventure, index) => {
            const completedCount =
                adventure.stops.filter(
                    stop => stop.completed
                ).length;

            const skippedCount =
                adventure.stops.filter(
                    stop => stop.skipped
                ).length;

            return `
                <article
                    class="journal-postcard"
                    data-journal-index="${index}"
                >
                    <button
                        class="journal-postcard-cover"
                        onclick="toggleJournalEntry(${index})"
                    >
                        <span class="journal-postcard-date">
                            📝 ${adventure.date || "Completed Adventure"}
                        </span>

                        <span class="journal-postcard-location">
                            ${adventure.location || ""}
                        </span>

                        <span class="journal-postcard-summary">
                            ${completedCount} completed
                            ·
                            ${skippedCount} skipped
                        </span>

                        <span
                            id="journalArrow-${index}"
                            class="journal-postcard-arrow"
                        >
                            ▾
                        </span>
                    </button>

                    <div
                        id="journalDetails-${index}"
                        class="journal-postcard-details hidden"
                    >
                        ${
                            adventure.stops.map(stop => `
                                <div class="journal-stop">
                                    <strong>
                                        ${
                                            stop.skipped
                                                ? "🚫"
                                                : "✅"
                                        }
                                        ${stop.quest || "Side Quest"}
                                    </strong>

                                    <p>${stop.name}</p>

                                    ${
                                        stop.address
                                            ? `<p>${stop.address}</p>`
                                            : ""
                                    }

                                    ${
                                        stop.mapsLink
                                            ? `
                                                <a
                                                    href="${stop.mapsLink}"
                                                    target="_blank"
                                                >
                                                    📍 Open in Maps
                                                </a>
                                            `
                                            : ""
                                    }
                                </div>
                            `).join("")
                        }

                        <button
                            class="delete-adventure-button"
                            onclick="deleteJournalEntry(${index})"
                        >
                            Delete Adventure
                        </button>
                    </div>
                </article>
            `;
        }).join("");
}

function toggleJournalEntry(index) {
    const details =
        document.getElementById(
            `journalDetails-${index}`
        );

    const arrow =
        document.getElementById(
            `journalArrow-${index}`
        );

    if (!details) {
        return;
    }

    const isHidden =
        details.classList.contains("hidden");

    details.classList.toggle(
        "hidden",
        !isHidden
    );

    if (arrow) {
        arrow.textContent =
            isHidden ? "▴" : "▾";
    }
}


function deleteJournalEntry(index) {
    const savedJournal =
        JSON.parse(
            localStorage.getItem(
                "sideQuestAdventureJournal"
            ) || "[]"
        );

    savedJournal.splice(index, 1);

    localStorage.setItem(
        "sideQuestAdventureJournal",
        JSON.stringify(savedJournal)
    );

    renderAdventureJournal();
}


/* ---------------- TYPING ANIMATION ---------------- */

async function typeLine(element, message) {
    const line = document.createElement("div");
    line.className = "loading-line";

    const prefix = document.createElement("span");
    prefix.textContent = "> ";

    const text = document.createElement("span");

    const cursor = document.createElement("span");
    cursor.className = "typing-cursor";
    cursor.textContent = "▋";

    line.appendChild(prefix);
    line.appendChild(text);
    line.appendChild(cursor);
    element.appendChild(line);

    for (const character of message) {
        text.textContent += character;
        await wait(28);
    }

    await wait(250);
    cursor.remove();
}


async function playLoadingAnimation(loadingState) {
    const loadingElement =
        document.getElementById("loadingText");

    if (!loadingElement) {
        return;
    }

    let messageIndex = 0;

    while (loadingState.active) {
        const message =
            loadingMessages[
                messageIndex % loadingMessages.length
            ];

        await typeLine(
            loadingElement,
            message
        );

        messageIndex++;

        if (loadingElement.children.length > 6) {
            loadingElement.removeChild(
                loadingElement.firstElementChild
            );
        }

        await wait(150);
    }
}


async function finishLoadingAnimation() {
    const loadingElement =
        document.getElementById("loadingText");

    if (!loadingElement) {
        return;
    }

    await typeLine(
        loadingElement,
        "Quest accepted!"
    );

    await wait(650);
}


/* ---------------- LOCATION ---------------- */

async function getLocation() {
    const typedLocation =
        locationInput.value.trim();

    if (typedLocation) {
        return typedLocation;
    }

    try {
        const geolocation =
            window.Capacitor?.Plugins?.Geolocation;

        if (!geolocation) {
            throw new Error(
                "Geolocation is unavailable."
            );
        }

        const permission =
            await geolocation.requestPermissions();

        if (
            permission.location !== "granted" &&
            permission.coarseLocation !== "granted"
        ) {
            throw new Error(
                "Location permission was denied."
            );
        }

        const position =
            await geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 15000
            });

        return `${position.coords.latitude},${position.coords.longitude}`;

    } catch (error) {
        console.error(
            "Location error:",
            error
        );

        alert(
            "Please enter a city or ZIP code, or allow location access."
        );

        return null;
    }
}


/* ---------------- REGULAR QUESTS ---------------- */

async function startSideQuest(type) {
    showScreen("homeScreen");

    const location = await getLocation();

    if (!location) {
        return;
    }

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
            "cheapfun"
        ];

        type =
            mysteryOptions[
                Math.floor(
                    Math.random() *
                    mysteryOptions.length
                )
            ];
    }

    document.getElementById("result").innerHTML = `
        <div class="quest-card loading-card">
            <h2>🎲 Rolling your side quest...</h2>
            <div
                id="loadingText"
                class="loading-text"
            ></div>
        </div>
    `;

    const loadingState = {
        active: true
    };

    const loadingAnimation =
        playLoadingAnimation(loadingState);

    try {
        const response = await fetch(
            `https://sidequest-q4tt.onrender.com/${type}?location=${encodeURIComponent(location)}`
        );

        if (!response.ok) {
            throw new Error(
                `Server returned ${response.status}`
            );
        }

        const quest =
            await response.json();

        loadingState.active = false;
        await loadingAnimation;

        if (!quest.name) {
            showQuestError(type);
            return;
        }

        await finishLoadingAnimation();

        const photoHtml = quest.photoUrl
            ? `
                <img
                    class="place-photo"
                    src="${quest.photoUrl}"
                    alt="${quest.name}"
                >
            `
            : "";

        document.getElementById("result").innerHTML = `
            <div class="quest-card result-card-enter">
                <h2>🎲 Side Quest Accepted</h2>

                ${photoHtml}

                <h3>${quest.quest}</h3>
                <h1>${quest.name}</h1>

                <p>${quest.address}</p>
                <p>⭐ ${quest.rating || "No rating yet"}</p>
                <p><em>${quest.mood || ""}</em></p>

                <a
                    href="${quest.mapsLink}"
                    target="_blank"
                >
                    Open in Google Maps
                </a>

                <br><br>

                <button onclick="startSideQuest('${type}')">
                    Roll Again
                </button>
            </div>
        `;

    } catch (error) {
        loadingState.active = false;
        await loadingAnimation;

        console.error(
            "Quest error:",
            error
        );

        showQuestError(type);
    }
}


function showQuestError(type) {
    document.getElementById("result").innerHTML = `
        <div class="quest-card result-card-enter">

            <h2>
                🎲 Side Quest... NOT Accepted
            </h2>

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
}


/* ---------------- MAKE BUTTON FUNCTIONS GLOBAL ---------------- */

window.startSideQuest = startSideQuest;
window.openPlanMyDay = openPlanMyDay;
window.openAdventureJournal = openAdventureJournal;
window.showHomeScreen = showHomeScreen;
window.continueAdventure = continueAdventure;
window.discardAdventure = discardAdventure;
window.confirmGenerateAgain = confirmGenerateAgain;
window.closeReplaceModal = closeReplaceModal;
window.generateNewAdventure = generateNewAdventure;
window.closeCompleteModal = closeCompleteModal;
window.buildMyAdventure = buildMyAdventure;
window.sharePlan = sharePlan;
window.deleteJournalEntry = deleteJournalEntry;


document.addEventListener(
    "DOMContentLoaded",
    () => {
        showScreen("homeScreen");
    }
);
window.toggleItineraryStop =
    toggleItineraryStop;
    
    window.skipItineraryStop =
    skipItineraryStop;

    window.toggleJournalEntry =
    toggleJournalEntry;

    