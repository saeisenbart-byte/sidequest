async function geocodeLocation(location, apiKey) {
    const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${location}&key=${apiKey}`
    );

    const data = await response.json();

    return {
        city: data.results[0].address_components[1].long_name,
        latitude: data.results[0].geometry.location.lat,
        longitude: data.results[0].geometry.location.lng
    };
}

module.exports = geocodeLocation;