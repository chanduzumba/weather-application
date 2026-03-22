//dom elements
const searchInput = document.getElementById("searchLocation");
const searchList = document.querySelector(".searchList");
const body = document.querySelector("body");
const videoBg = document.querySelector("video");
const currentLocationButton = document.querySelector('#currentLocationBtn');
const dropdownMenu = document.querySelector('.dropdown-menu');
const forecastContainer = document.querySelector('.forecastContainer');
const searchBtn = document.getElementById("searchBtn");
const toggle = document.getElementById("toggle");

//API key from Open Weather API to make api calls
const apiKey = '8aec84a0fbcfadc5b6fa4ff8c7a56a26';

//add event listener to search on input
searchInput.addEventListener(('input'), e => fetchLocationSuggestions(e.target.value));

//add event listener to search on enter key press
searchInput.addEventListener(('keydown'), e => {
    if (e.key === 'Enter') {
        fetchLocationSuggestions(e.target.value);
    }
});

//add event listener for dropdown menu
dropdownMenu.addEventListener(('mouseenter'), () => updateRecentSearchList());

//add event listener for searchList
dropdownMenu.addEventListener(('mouseenter'), () => updateRecentSearchList());

//add event listener for hide search list on leaving dropdown
searchList.addEventListener(('mouseleave'), () => hideSearchList());

//add event listener to body to hide search list
body.addEventListener('click', () => {
    hideSearchList();
});

//add event listener for search button
searchBtn.addEventListener('click', () => {
    fetchLocationSuggestions(searchInput.value);
});

//add event listener for current location button
currentLocationButton.addEventListener('click', () => {
    getLocation();
});

//add event listener for toggle
toggle.addEventListener('change', () => {
    toggleMetric();
});

//function to hide locations search list
function hideSearchList() {
    searchList.classList.add("hidden")
}

//update recent search list
function updateRecentSearchList() {
    const recentLocations = JSON.parse(localStorage.getItem('Locations')) || [];
    displayLocationSuggestions(recentLocations);
}

//show dropdown icon
function showDropdown() {
    if ((localStorage.getItem('Locations') || []).length) {
        dropdownMenu.classList.remove('hidden');
    }
}

//function to fetch location suggestions
async function fetchLocationSuggestions(query) {
    showDropdown();
    if (query.length < 2) {
        hideSearchList();
        showToast('Please enter at least 2 characters to search')
        return
    }
    try {
        //fetch locations based on input location
        const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`);
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
        //Adding event listener to read enter or space for selection
        listItem.addEventListener('keydown', (e) => {
            if (e.key == 'Enter' || e.key == ' ') {
                selectLocation(location, listItem.textContent);
            }
        })
        searchList.appendChild(listItem); // append list within <ul></ul> element
    });
}

//get List Item
function getListItem() {
    const listItem = document.createElement('li');
    listItem.classList.add("p-4", "cursor-pointer", "transition", "delay-75", "ease-in", "border", "border-b-4", "border-b-violet-400", 'hover:border-b-violet-900');
    //adding accessibility using tab key
    listItem.setAttribute('tabindex', 0)
    return listItem;
}

//function to handle on click of location from list
function selectLocation(locationObj, locationText) {
    searchInput.value = locationText; // update input field with selected value
    hideSearchList(); // hide search list
    const toggle = document.getElementById('toggle');
    toggle.checked = false; // reset toggle to default metric unit on new search
    //Add to local storage
    const recentLocations = JSON.parse(localStorage.getItem('Locations')) || []
    if (!recentLocations.find(location => location.lat == locationObj.lat)) {
        recentLocations.push(locationObj)
        localStorage.setItem('Locations', JSON.stringify(recentLocations))
    }
    // fetchWeatherForecast(locationObj, 'metric'); // make api call to get weather for selected location
    fetch5DayForecast(locationObj, 'metric'); //make api call to get forecast data
}

//fetch 5-day forecast api
async function fetch5DayForecast(location, units) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${location.lat}&lon=${location.lon}&units=${units}&appid=${apiKey}`) // forecast
        //extract weather json from response
        const weatherInfo = await response.json();
        if (weatherInfo) {
            //update DOM with weather data pending
            searchInput.value = `${weatherInfo.city.name}, ${weatherInfo.city.country}`;
            localStorage.setItem('currentLocation', JSON.stringify(location))
            updateWeatherData(weatherInfo);
            updateForecastData(weatherInfo);
        } else {
            showToast('No 5-day forecast data found for the location')
        }
    }
    catch (error) {
        showToast('Error fetching 5-day forecast data')
    }
}

//updateForecastData to update DOM with 5-day forecastdata
function updateForecastData(weatherList) {
    weatherList = weatherList.list.filter((item) => item.dt_txt.includes("12:00:00")); // filter data for 5 days at 12 PM
    forecastContainer.innerHTML = '';
    // loop through each weather data and create a card for each day
    weatherList.forEach(weather => {
        const weatherDiv = document.createElement('div');
        const dayName = new Date(weather.dt_txt).toLocaleDateString('en-US', { weekday: 'short' });
        // Each card will have day name, weather icon, weather condition, temperature, wind speed and humidity
        weatherDiv.innerHTML = '<span class="weatherDate">' + dayName + '</span>' +
            '<span class="weatherIcon"><img src="https://openweathermap.org/img/wn/' + weather.weather[0].icon + '.png" alt="Weather Icon"></span>' +
            '<span class="weatherCondition">' + weather.weather[0].description + '</span>' +
            '<div style="width: 100%; border-top: 1px solid rgba(255, 255, 255, 0.15); margin: 0.5rem 0;"></div>' +
            '<span class="weatherTemp"><i class="fas fa-thermometer-half"></i> <span>' + weather.main.temp + '<sup>°</sup></span></span>' +
            '<span class="weatherTemp"><i class="fas fa-wind"></i> <span>' + weather.wind.speed + ' m/s</span></span>' +
            '<span class="weatherTemp"><i class="fas fa-tint"></i> <span>' + weather.main.humidity + '%</span></span>';
        forecastContainer.appendChild(weatherDiv); // append each card to forecast container
    })
}

//updateWeatherData function to update DOM with dynamic data
function updateWeatherData(weather) {
    const main = weather.list[0].main;
    const weatherDetails = weather.list[0].weather[0];
    const temp = document.querySelector('.weatherTemp');
    const weatherLocation = document.querySelector('.weatherLocation');
    const weatherDate = document.querySelector('.weatherDate');
    const day = document.querySelector('.weatherCondition');
    const icon = document.querySelector('.weatherIcon');
    const feelsLike = document.querySelector('.weatherFeelsLike');
    const humidity = document.querySelector('.weatherHumidity');
    const weatherWindSpeed = document.querySelector('.weatherWindSpeed');
    temp.innerHTML = `<i class="fas fa-thermometer-half "></i> ${main.temp}<sup>o</sup>` // set current temperature
    weatherLocation.innerHTML = `${weather.city.name}, ${weather.city.country}`; // set location name
    const today = new Date(weather.list[0].dt_txt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    weatherDate.innerHTML = `Today, ${today}` // set current date
    day.innerHTML = `${weatherDetails.description} day` //set weather condition like clear sky, rain, snow etc
    icon.innerHTML = `<img src="https://openweathermap.org/img/wn/${weatherDetails.icon}@2x.png" alt="Weather ICON"></img>` // set weather icon
    feelsLike.innerHTML = `${main.feels_like}<sup>o</sup>`
    humidity.innerHTML = `${main.humidity}%`
    weatherWindSpeed.innerHTML = `${weather.list[0].wind.speed} m/s`
    changeBackdrop(weatherDetails.id); // change background video based on weather condition code
    removePulseAnimation(); // remove pulse animation from current location button if applied
    showDropdown(); // show dropdown icon for recently searched locations

    // Check for extreme temperature and show alert
    const checkbox = document.getElementById('toggle');
    const unit = checkbox.checked ? 'imperial' : 'metric';
    checkExtremeTemperature(main.temp, unit);

    // Determine rain amount (some responses include 1h or 3h values)
    const rainAmount = weather.list[0].rain ? (weather.list[0].rain['1h'] || weather.list[0].rain['3h'] || 0) : 0;
    checkExtremeRainfall(rainAmount);
}

//function to change background video
async function changeBackdrop(code) {
    if (code >= 200 && code <= 232) {
        videoBg.src = '/assets/thunderbg.mp4' //load thunder storm bg
    } else if (code >= 300 && code <= 531) {
        videoBg.src = '/assets/rainybg.mp4' //load rainy bg
    } else if (code >= 600 && code <= 622) {
        videoBg.src = '/assets/snowybg.mp4' //load snowy bg
    } else if (code >= 700 && code <= 781) {
        videoBg.src = '/assets/windybg.mp4' //load windy bg
    } else if (code >= 800 && code <= 804) {
        videoBg.src = '/assets/skybg.mp4' // load cloudy bg
    }
    await videoBg.load()
    await videoBg.play()
}

// function to get current location
function getLocation() {
    if (navigator.geolocation) {
        //add pulse animation to button
        currentLocationButton.classList.add('animate-pulse')

        // Get current position; specify success, error, and optional options callbacks
        navigator.geolocation.getCurrentPosition((position) => fetch5DayForecast({ lat: position.coords.latitude, lon: position.coords.longitude }, 'metric'), showError, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });
    } else {
        removePulseAnimation();
        showToast('Geolocation not supported by your browser')
    }
}

//function to remove pulse animation on button
function removePulseAnimation() {
    currentLocationButton.classList.remove('animate-pulse')
}

//function to handle geolocation errors
function showError(error) {
    removePulseAnimation();
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

//function to check and show alert for extreme temperatures
function checkExtremeTemperature(temp, unit) {
    let isExtreme = false;
    let alertMessage = '';

    if (unit === 'metric') {
        // Celsius thresholds
        if (temp > 40) {
            isExtreme = true;
            alertMessage = `⚠️ EXTREME HEAT ALERT! Temperature is ${temp}°C - Stay hydrated and avoid prolonged sun exposure!`;
        } else if (temp < 0) {
            isExtreme = true;
            alertMessage = `❄️ EXTREME COLD ALERT! Temperature is ${temp}°C - Dress warmly and limit outdoor activities!`;
            changeBackdrop(600); // change to snowy backdrop for extreme cold
        }
    } else {
        // Fahrenheit thresholds
        if (temp > 104) {
            isExtreme = true;
            alertMessage = `⚠️ EXTREME HEAT ALERT! Temperature is ${temp}°F - Stay hydrated and avoid prolonged sun exposure!`;
        } else if (temp < 32) {
            isExtreme = true;
            alertMessage = `❄️ EXTREME COLD ALERT! Temperature is ${temp}°F - Dress warmly and limit outdoor activities!`;
            changeBackdrop(600); // change to snowy backdrop for extreme cold
        }
    }

    if (isExtreme) {
        showExtremeAlert(alertMessage);
    }
}

//function to check and show alert for extreme rainfall
function checkExtremeRainfall(amount) {
    // amount is in millimeters (mm)
    if (amount >= 50) { // threshold for very heavy rain in short period
        showExtremeAlert(`🌧️ HEAVY RAIN ALERT! ${amount}mm of precipitation detected - seek shelter and avoid flooded areas.`);
    }
}
//function to display extreme temperature alert
function showExtremeAlert(message) {
    const alert = document.createElement('div');
    alert.textContent = message;
    alert.className = "fixed top-4 left-1/2 transform -translate-x-1/2 bg-orange-600 text-white px-6 py-3 rounded-lg shadow-2xl z-50 font-bold text-center max-w-md";
    document.body.appendChild(alert);
    setTimeout(() => {
        if (document.body.contains(alert)) {
            document.body.removeChild(alert);
        }
    }, 5000);
}

//function to change metric and make api call
function toggleMetric() {
    const checkbox = document.getElementById('toggle');
    if (checkbox.checked) {
        fetch5DayForecast(JSON.parse(localStorage.getItem('currentLocation')), 'imperial') // Farenheit data(JSON.parse(localStorage.getItem('currentLocation')), 'imperial') // Farenheit data
    } else {
        fetch5DayForecast(JSON.parse(localStorage.getItem('currentLocation')), 'metric') // Celsius data(JSON.parse(localStorage.getItem('currentLocation')), 'metric') // Celsius data
    }

}

//default call weather forecast for London, Ontario on page load
fetch5DayForecast({ lat: 42.9832, lon: -81.2434 }, 'metric');
setInterval(() => {
    fetch5DayForecast(JSON.parse(localStorage.getItem('currentLocation')) || { lat: 42.9832, lon: -81.2434 }, 'metric')
}, 900000) // auto refresh weather data every 15 mins
//show dropdown for recently searched locations
showDropdown()