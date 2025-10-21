// --- DOM Element References ---
const currentLocationEl = document.getElementById("currentLocation");
const rainStatus = document.getElementById("rainStatus");
const weatherIcon = document.getElementById("weatherIcon");
const weatherDescription = document.getElementById("weatherDescription");
const checkWeatherBtn = document.getElementById("checkWeatherBtn");

const modal = document.getElementById("weatherModal");
const modalClose = document.getElementById("modalClose");
const modalWeatherInfo = document.getElementById("modalWeatherInfo");

const toggleBtn = document.getElementById('toggleBtn');
const espPopup = document.getElementById('espPopup');
const clothesAnimation = document.getElementById('clothesAnimation');
const bgAnimation = document.getElementById("bgAnimation"); // For background animations
const clothesRope = document.getElementById('clothesRope'); // NEW: Reference to the rope element

// --- Configuration ---
// IMPORTANT: Replace with your ESP32's actual IP address on your local network
const ESP32_IP = "http://192.168.230.214/data"; // Assuming /data, /on, /off endpoints
// IMPORTANT: Replace with your actual OpenWeatherMap API Key
const API_KEY = "b8bb716c48221f628d80f13c9d40b195"; // Your OpenWeatherMap API Key

// --- Utility Functions ---

/**
 * Converts Unix timestamp to a localized time string.
 * @param {number} unixTime - The Unix timestamp.
 * @returns {string} Local time string (e.g., "02:30 PM").
 */
function convertUnixToLocalTime(unixTime) {
  const date = new Date(unixTime * 1000);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Converts degrees to compass direction (e.g., 0 to "N").
 * @param {number} num - Degrees.
 * @returns {string} Compass direction.
 */
function degToCompass(num) {
  const val = Math.floor((num / 22.5) + 0.5);
  const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
                "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return arr[(val % 16)];
}

/**
 * Updates the body background and rain animation based on weather conditions and cloudiness.
 * @param {string} weatherMain - Main weather condition (e.g., "Clear", "Rain", "Clouds").
 * @param {number} cloudiness - Cloudiness percentage (0-100).
 */
function updateBackgroundAnimation(weatherMain, cloudiness) {
  // Remove all existing background classes first
  document.body.classList.remove("cloudy-bg", "sunny-bg", "rainy-bg", "default-bg");

  const lowerCaseWeather = weatherMain.toLowerCase();

  // Prioritize rain condition
  if (lowerCaseWeather.includes("rain") || lowerCaseWeather.includes("drizzle") || lowerCaseWeather.includes("thunderstorm")) {
    document.body.classList.add("rainy-bg");
  } else if (cloudiness > 30) { // If not raining AND cloudiness is more than 30%
    // As per your request: more than 30% cloudiness -> sunny background
    document.body.classList.add("sunny-bg");
  } else if (cloudiness <= 30) { // If not raining AND cloudiness is 30% or less
    // As per your request: 30% or less cloudiness -> cloudy background
    document.body.classList.add("cloudy-bg");
  } else {
    document.body.classList.add("default-bg"); // Fallback
  }
}

/**
 * Displays a temporary popup message for ESP32 status.
 * @param {string} message - The message to display.
 */
function showESPPopup(message) {
  espPopup.textContent = message;
  espPopup.style.display = "block";
  espPopup.classList.remove('fadeInOutPopup'); // Restart animation
  void espPopup.offsetWidth; // Trigger reflow
  espPopup.classList.add('fadeInOutPopup');

  setTimeout(() => {
    espPopup.style.display = "none";
  }, 3500); // Matches CSS animation duration
}

// --- Weather Data Fetching ---

/**
 * Fetches current weather, UV index, Air Quality, and 5-day forecast.
 * Updates UI elements and modal.
 * @param {number} lat - Latitude.
 * @param {number} lon - Longitude.
 */
async function fetchWeather(lat, lon) {
  try {
    const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
    const uvRes = await fetch(`https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
    const aqiRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
    const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);

    if (!weatherRes.ok || !uvRes.ok || !aqiRes.ok || !forecastRes.ok) {
      const errorText = await Promise.all([
          weatherRes.text(), uvRes.text(), aqiRes.text(), forecastRes.text()
      ]).then(texts => texts.join(' | '));
      throw new Error(`Failed to fetch weather data. Statuses: ${weatherRes.status}, ${uvRes.status}, ${aqiRes.status}, ${forecastRes.status}. Details: ${errorText}`);
    }

    const weatherData = await weatherRes.json();
    const uvData = await uvRes.json();
    const aqiData = await aqiRes.json();
    const forecastData = await forecastRes.json();

    const weatherMain = weatherData.weather[0].main;
    const weatherDesc = weatherData.weather[0].description;
    const temp = Math.round(weatherData.main.temp);
    const feelsLike = Math.round(weatherData.main.feels_like);
    const humidity = weatherData.main.humidity;
    const windSpeed = weatherData.wind.speed;
    const windDeg = weatherData.wind.deg;
    const visibility = weatherData.visibility / 1000; // Convert meters to km
    const pressure = weatherData.main.pressure;
    const cloudiness = weatherData.clouds.all; // Cloudiness percentage
    const sunrise = weatherData.sys.sunrise;
    const sunset = weatherData.sys.sunset;
    const location = `${weatherData.name}, ${weatherData.sys.country}`;
    const uv = uvData.value;
    const aqi = aqiData.list[0].main.aqi;
    const aqiLevels = ["Good", "Fair", "Moderate", "Poor", "Very Poor"];
    const aqiText = aqiLevels[aqi - 1] || "Unknown"; // AQI is 1-5

    // Update main display
    currentLocationEl.textContent = location;
    rainStatus.textContent = `${temp}°C`;
    weatherDescription.textContent = weatherDesc;
    updateBackgroundAnimation(weatherMain, cloudiness); // Pass cloudiness here

    // Update weather icon based on main condition
    const lowerCaseWeather = weatherMain.toLowerCase();
    if (lowerCaseWeather.includes("rain") || lowerCaseWeather.includes("drizzle") || lowerCaseWeather.includes("thunderstorm")) {
      weatherIcon.src = "https://cdn-icons-png.flaticon.com/512/1163/1163657.png";
    } else if (lowerCaseWeather.includes("clear")) {
      weatherIcon.src = "https://cdn-icons-png.flaticon.com/512/869/869869.png";
    } else if (lowerCaseWeather.includes("cloud")) {
      weatherIcon.src = "https://cdn-icons-png.flaticon.com/512/414/414825.png";
    } else {
      weatherIcon.src = "https://cdn-icons-png.flaticon.com/512/1163/1163624.png"; // Default weather icon
    }

    // Populate weather modal with detailed info
    modalWeatherInfo.innerHTML = `
      <p><strong>Location:</strong> ${location}</p>
      <p><strong>Condition:</strong> ${weatherDesc}</p>
      <p><strong>Temperature:</strong> ${temp}°C (Feels like ${feelsLike}°C)</p>
      <p><strong>Humidity:</strong> ${humidity}%</p>
      <p><strong>Wind:</strong> ${windSpeed} m/s (${degToCompass(windDeg)})</p>
      <p><strong>Visibility:</strong> ${visibility} km</p>
      <p><strong>Cloud Cover:</strong> ${cloudiness}%</p>
      <p><strong>Pressure:</strong> ${pressure} hPa</p>
      <p><strong>UV Index:</strong> ${uv}</p>
      <p><strong>Air Quality:</strong> ${aqiText} (AQI ${aqi})</p>
      <p><strong>Sunrise:</strong> ${convertUnixToLocalTime(sunrise)}</p>
      <p><strong>Sunset:</strong> ${convertUnixToLocalTime(sunset)}</p>
    `;

    // Populate Forecast Section (next 5 hourly forecasts)
    const forecastContainer = document.getElementById("rainForecast");
    if (forecastData && forecastData.list && forecastData.list.length > 0) {
      const forecastHours = forecastData.list.slice(0, 5); // Get the next 5 entries
      let forecastHTML = "";
      forecastHours.forEach(item => {
        const time = new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const condition = item.weather[0].main;
        const temp = Math.round(item.main.temp);
        forecastHTML += `<p>${time}: ${condition}, ${temp}°C</p>`;
      });
      forecastContainer.innerHTML = forecastHTML;
    } else {
      forecastContainer.innerHTML = "<p>Forecast unavailable. Please try again later.</p>";
    }

    // Alerts Section (currently static)
    document.getElementById("alertsSection").innerHTML = `<p>No active alerts</p>`;

    checkWeatherBtn.textContent = "Check Live Weather →"; // Reset button text
  } catch (err) {
    console.error("Weather Fetch Error:", err);
    currentLocationEl.textContent = "Location Error";
    rainStatus.textContent = "--°C";
    weatherDescription.textContent = "Failed to fetch weather";
    checkWeatherBtn.textContent = "Retry Weather";

    modalWeatherInfo.innerHTML = `<p style="color: red;">Error: ${err.message}</p><p>Please check your internet connection or API key.</p>`;
  } finally {
    checkWeatherBtn.disabled = false;
  }
}

// --- Event Listeners ---

// Click listener for the "Check Live Weather" button
checkWeatherBtn.addEventListener("click", () => {
  currentLocationEl.textContent = "Locating...";
  rainStatus.textContent = "Loading...";
  weatherDescription.textContent = "Fetching data...";
  checkWeatherBtn.disabled = true;
  checkWeatherBtn.textContent = "Loading...";

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetchWeather(latitude, longitude);
        modal.style.display = "block"; // Open modal on successful fetch
      },
      (err) => {
        console.error("Geolocation Error:", err);
        currentLocationEl.textContent = "Location Denied";
        rainStatus.textContent = "--°C";
        weatherDescription.textContent = "Location access needed";
        checkWeatherBtn.textContent = "Enable Location";
        checkWeatherBtn.disabled = false;
        modalWeatherInfo.textContent = "Location access denied. Please enable location services in your browser settings to get weather data.";
        modal.style.display = "block"; // Show modal on error too
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 } // Geolocation options
    );
  } else {
    currentLocationEl.textContent = "Geolocation N/A";
    rainStatus.textContent = "--°C";
    weatherDescription.textContent = "Browser not supported";
    checkWeatherBtn.textContent = "Browser Not Supported";
    checkWeatherBtn.disabled = true; // Cannot proceed if not supported
    modalWeatherInfo.textContent = "Geolocation is not supported by your browser. Please use a modern browser to access this feature.";
    modal.style.display = "block";
  }
});

// Close modal when 'x' is clicked
modalClose.onclick = () => {
  modal.style.display = "none";
};

// Close modal when clicking outside the modal content
window.onclick = (event) => {
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

// Toggle button for device control and clothes animation
toggleBtn.addEventListener("change", () => {
  const isChecked = toggleBtn.checked;

  // Remove existing animation classes to reset state
  clothesRope.classList.remove('animate');
  clothesAnimation.classList.remove('animate');
  // Force reflow to restart animation by re-adding the classes
  void clothesRope.offsetWidth; // Trigger reflow for rope
  void clothesAnimation.offsetWidth; // Trigger reflow for clothes

  if (isChecked) {
    // Start rope animation
    clothesRope.classList.add('animate');
    // Start clothes animation
    clothesAnimation.classList.add('animate');
    clothesAnimation.style.opacity = '1'; // Ensure clothes are visible during animation
  } else {
    // When toggle is off, hide rope and clothes instantly
    clothesRope.style.opacity = '0';
    clothesRope.style.transform = 'scaleX(0)'; // Reset rope state immediately
    clothesAnimation.style.opacity = '0';
    // No animation for turning off, just reset state
  }

  const url = isChecked ? `${ESP32_IP}/on` : `${ESP32_IP}/off`;

  // Fetch request to ESP32
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(data => {
      console.log("ESP32 Response:", data);
      showESPPopup(`ESP32 turned ${isChecked ? "ON" : "OFF"}`);
    })
    .catch(error => {
      console.error("ESP32 Communication Error:", error);
      showESPPopup("⚠ Failed to reach ESP32. Check device or network.");
      toggleBtn.checked = !isChecked; // Revert toggle state on error
      // Also reset rope/clothes visibility if toggle reverts due to error
      clothesRope.classList.remove('animate');
      clothesAnimation.classList.remove('animate');
      clothesRope.style.opacity = '0';
      clothesRope.style.transform = 'scaleX(0)';
      clothesAnimation.style.opacity = '0';
    });
});

// --- ESP32 Data Fetch Section ---
const ESP32_DATA_URL = `${ESP32_IP}/data`;

/**
 * Fetches and updates ESP32 sensor data on the UI.
 */
async function updateESPData() {
  const espDataContent = document.getElementById("espDataContent");

  try {
    const response = await fetch(ESP32_DATA_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json(); // Assuming ESP32 returns JSON

    espDataContent.innerHTML = `
      <p><strong>Cloth Status:</strong> ${data.clothStatus || 'N/A'}</p>
      <p><strong>Dryness Level:</strong> ${data.dryPercent || 'N/A'}%</p>
      <p><strong>Rain Status:</strong> ${data.rainStatus || 'N/A'}</p>
    `;
  } catch (error) {
    espDataContent.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    console.error("ESP32 Data Fetch Error:", error);
  }
}

// Initial fetch of ESP32 data and set interval for periodic updates
updateESPData();
setInterval(updateESPData, 10000); // Update every 10 seconds

// Initial weather load: Optionally uncomment to fetch weather on page load.
// If commented, weather updates only when "Check Live Weather" button is clicked.
// checkWeatherBtn.click();
// -- CITY WEATHER SEARCH --
document.getElementById('goBtn').onclick = async () => {
  const city = document.getElementById('searchCity').value.trim();
  if (!city) return;
  const display = document.getElementById('weatherDisplay');
  display.innerHTML = "Loading...";
  const apiKey = "b8bb716c48221f628d80f13c9d40b195";
  const resp = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`);
  if (!resp.ok) { display.textContent = "City not found!"; return; }
  const data = await resp.json();
  const weather = data.weather[0].main.toLowerCase();
 display.innerHTML = `
  <h2>${data.name}, ${data.sys.country}</h2>
  <div class="weather-visual">${weather === 'clear' ? '☀️' : weather === 'rain' ? '🌧️' : weather === 'snow' ? '❄️' : ''}</div>
  <p>${data.weather[0].description}</p>
  <p>${Math.round(data.main.temp)}°C, Humidity: ${data.main.humidity}%</p>
  <p><em>${weatherAdvice(weather)}</em></p>
`;

// Add background color class to the weather-visual div
const weatherVisualDiv = display.querySelector('.weather-visual');
weatherVisualDiv.classList.remove('clear', 'rain', 'snow');  // remove old classes if any
if (['clear', 'rain', 'snow'].includes(weather)) {
  weatherVisualDiv.classList.add(weather);  // add the new class for bg color
}

// -- PERSONAL DIARY --
document.getElementById('saveDiary').onclick = () => {
  const entry = document.getElementById('diaryInput').value.trim();
  if (!entry) return;
  let log = document.getElementById('diaryLog');
  log.innerHTML += `<div><strong>${(new Date()).toLocaleString()}:</strong> ${entry}</div>`;
  document.getElementById('diaryInput').value = '';
};
// Example helper
function weatherAdvice(type) {
  switch(type) {
    case 'rain': return 'Don’t forget your umbrella!';
    case 'clear': return 'Great day to be outdoors!';
    case 'snow': return 'Bundle up — it’s cold!';
    default: return 'Stay weather-wise!';
  }
}

}