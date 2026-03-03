//dom elements
const searchInput = document.getElementById("searchLocation");
const searchList = document.querySelector(".searchList");
const body = document.querySelector("body");
const videoBg = document.querySelector("video");
const currentLocationButton = document.querySelector('#currentLocationBtn');
const dropdownMenu = document.querySelector('.dropdown-menu');

//API key from Open Weather API to make api calls
const apiKey = '8aec84a0fbcfadc5b6fa4ff8c7a56a26';

//add event listener to search on input
searchInput.addEventListener(('input'), e => fetchLocationSuggestions(e.target.value));

//add event listener for dropdown menu
dropdownMenu.addEventListener(('mouseenter'),() => updateRecentSearchList());

//add event listener for searchList
dropdownMenu.addEventListener(('mouseenter'),() => updateRecentSearchList());

//add event listener for hide search list on leaving dropdown
searchList.addEventListener(('mouseleave'),() => hideSearchList());

//add event listener to body to hide search list
body.addEventListener(('click'), () => {
    hideSearchList();
})

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
    if((localStorage.getItem('Locations') || []).length) {
        dropdownMenu.classList.remove('hidden');
    }
}

//function to fetch location suggestions
async function fetchLocationSuggestions(query) {
    showDropdown();
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
        //Adding event listener to read enter or space for selection
        listItem.addEventListener('keydown', (e) => {
            if(e.key == 'Enter' || e.key == ' ') {
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
    //Add to local storage
    const recentLocations = JSON.parse(localStorage.getItem('Locations')) || []
    if(!recentLocations.find(location => location.lat == locationObj.lat)){
        recentLocations.push(locationObj)
        localStorage.setItem('Locations', JSON.stringify(recentLocations))
    }
    fetchWeatherForecast(locationObj, 'metric'); // make api call to get weather for selected location
}

//API call function to fetch weather details of selected location
async function fetchWeatherForecast(location, units) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&units=${units}&appid=${apiKey}`) // OPEN weather api call using lat and long and API key
        //extract weather json from response
        const weatherData = await response.json();
        if (weatherData) {
            //update DOM with weather data pending
            searchInput.value = `${weatherData.name}`
            localStorage.setItem('currentLocation', JSON.stringify(location))
            updateWeatherData(weatherData);
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
    const temp = document.querySelector('.weatherTemp');
    const day = document.querySelector('.weatherCondition');
    const icon = document.querySelector('.weatherIcon'); 
    temp.innerHTML = `${main.temp}<sup>o</sup>`
    day.innerHTML = `${weather.weather[0].description} day`
    icon.innerHTML = `<img src="https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png" alt="Weather ICON"></img>`
    changeBackdrop(weather.weather[0].id);
    removePulseAnimation();
    showDropdown();
}

//function to change background video
function changeBackdrop(code) {
    if(code >= 200 && code <= 232) {
        videoBg.src = '../assets/thunderbg.mp4' //load thunder storm bg
    } else if (code >= 300 && code <=531) {
        videoBg.src = '../assets/rainybg.mp4' //load rainy bg
    } else if (code >= 600 && code <= 622) {
        videoBg.src = '../assets/snowybg.mp4' //load snowy bg
    } else if (code >= 700 && code <= 781) {
        videoBg.src = '../assets/windybg.mp4' //load windy bg
    } else if (code >= 800 && code <= 804) {
        videoBg.src = '../assets/skybg.mp4' // load cloudy bg
    }
    videoBg.load()
    videoBg.play()
}

// function to get current location
function getLocation() {
    if (navigator.geolocation) {
        //add pulse animation to button
        currentLocationButton.classList.add('animate-pulse')
        
        // Get current position; specify success, error, and optional options callbacks
        navigator.geolocation.getCurrentPosition((position) => fetchWeatherForecast({ lat: position.coords.latitude, lon: position.coords.longitude }, 'metric'), showError, {
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

//default call weather forecast for bangalore
fetchWeatherForecast({lat:12.9629,lon:77.5775}, 'metric')
//show dropdown for recently searched locations
showDropdown()