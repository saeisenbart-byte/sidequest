async function findPlaces(latitude, longitude, searchText, apiKey, includedTypes = []) {
    const requestBody = {
        textQuery: searchText,
        locationBias: {
            circle: {
                center: {
                    latitude: latitude,
                    longitude: longitude
                },
               radius: 8046
            }
        }
    };

    if (includedTypes.length > 0) {
        requestBody.includedType = includedTypes[0];
    }

    const response = await fetch(
        "https://places.googleapis.com/v1/places:searchText",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": apiKey,
                "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.rating,places.googleMapsUri,places.photos,places.types"
            },
            body: JSON.stringify(requestBody)
        }
    );

    const data = await response.json();

    return data.places || [];
}

module.exports = findPlaces;