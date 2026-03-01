//dom elements
const searchInput = document.getElementById("searchLocation");
const searchList = document.querySelector(".searchList");
const body = document.querySelector("body");

//API key from Open Weather API to make api calls
const apiKey = '8aec84a0fbcfadc5b6fa4ff8c7a56a26';

//add event listener to search on input
searchInput.addEventListener(('input'), e => fetchLocationSuggestions(e.target.value));

//add event listener to body to hide search list
body.addEventListener(('click'), () => {
    hideSearchList();
})

//function to hide locations search list
function hideSearchList() {
    searchList.classList.add("hidden")
}

//function to fetch location suggestions
async function fetchLocationSuggestions(query) {
    if (query.length < 2) {
        hideSearchList();
        return
    }
    try {
        //fetch locations based on input location
        const response = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`);
        const locationData = await response.json(); // convert response to json
        if (locationData && locationData.length) { // check if data is present
            displayLocationSuggestions(locationData); // display location list to select
        } else {
            showToast('No locations found')
        }

    } catch (error) {
        showToast('Failed to fetch locations')
    }
}

//display each location in a list to select
function displayLocationSuggestions(locationArray) {
    searchList.classList.remove('hidden');  //display search list of locations
    searchList.innerHTML = ''; // empty first before displaying new data

    locationArray.forEach(location => {
        const listItem = getListItem();
        listItem.textContent = `${location.name}, ${location.state}, ${location.country}`;
        //Adding event listener to each list to handle o click and fetch weather data
        listItem.addEventListener('click', () => {
            selectLocation(location, listItem.textContent);
        });
        searchList.appendChild(listItem); // append list within <ul></ul> element
    });
}

//get List Item
function getListItem() {
    const listItem = document.createElement('li');
    listItem.classList.add("p-4", "cursor-pointer", "transition", "delay-75", "ease-in", "border", "border-b-4", "border-b-violet-400");
    return listItem;
}

//function to handle on click of location from list
function selectLocation(locationObj, locationText) {
    searchInput.value = locationText; // update input field with selected value
    hideSearchList(); // hide search list
    fetchWeatherForecast(locationObj); // make api call to get weather for selected location
}

//API call function to fetch weather details of selected location
async function fetchWeatherForecast(location) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&units=metric&appid=${apiKey}`) // OPEN weather api call using lat and long and API key
        //extract weather json from response
        const weatherData = await response.json();
        if (weatherData) {
            //update DOM with weather data pending
            // updateWeatherData(weatherData);
            const main = weatherData.main;
    const temp = document.querySelector('.currentWeather>h1');
    temp.innerHTML = `${main.temp}<sup>o</sup>`
        } else {
            showToast('No weather data found for the location')
        }
    }
    catch (error) {
        showToast('Error fetching weather data')
    }
}

//updateWeatherData function to update DOM with dynamic data
function updateWeatherData(weather) {
    const main = weather.main;
    const temp = document.querySelector('.currentWeather:firstChild');
    temp.innerHTML = `${main.temp}<sup>o</sup>`
}

// function to get current location
function getLocation() {
    if (navigator.geolocation) {
        // Get current position; specify success, error, and optional options callbacks
        navigator.geolocation.getCurrentPosition((position) => fetchWeatherForecast({ lat: position.coords.latitude, lon: position.coords.longitude }), showError, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        });
    } else {
        showToast('Geolocation not supported by your browser')
    }
}

function showError(error) {
    let errMsg = '';
    switch (error.code) {
        case error.PERMISSION_DENIED:
            errMsg = "User denied the request for Geolocation.";
            break;
        case error.POSITION_UNAVAILABLE:
            errMsg = "Location information is unavailable.";
            break;
        case error.TIMEOUT:
            errMsg = "The request to get user location timed out.";
            break;
        case error.UNKNOWN_ERROR:
            errMsg = "An unknown error occurred.";
            break;
    }
    showToast(errMsg)
}

//show toaster message for api errors
function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.className = "fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50";
  document.body.appendChild(toast);
  setTimeout(() => {
    document.body.removeChild(toast);
  }, 3000);
}

//default call
fetchWeatherForecast({lat:12.9629,lon:77.5775})