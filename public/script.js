/*
 * This is the script code for the application, which is the non-viewable side of things
 * The code handles much of the calculations, formatting, and error handling
 * The use of an API is the user weather/time/date description in the bottom right corner
 */

const socket = io();

new Vue({
  el: '#app',
  data: {
    // Initialization of many variables that are used below
    adminLoginError: null,
    adminPassword: '',
    adminUsers: null,
    city: '',
    correctNumber: null,
    currentPage: 'register',
    formattedDate: '',
    formattedTime: '',
    gameOver: false,
    gameResult: '',
    gameStatus: '',
    guess: null,
    guessSubmitted: false,
    guesses: [],
    loginError: null,
    loginMessage: null,
    password: '',
    playerCount: 0,
    registrationError: null,
    registrationMessage: null,
    showAdminLogin: false,
    username: '',
    weatherCelsius: '',
    weatherDescription: '',
    weatherIcon: '',
    yourGuess: null,
  },
  methods: {
    // Handles the user's registration
    register() {
      // Error handling for the username and password length
      if (this.username.length < 6 || this.password.length < 6) {
        this.registrationError = 'Username and password must be at least 6 characters long.';
        return;
      }
      socket.emit('register', { username: this.username, password: this.password });
      socket.on('registration_success', (data) => {
        this.registrationMessage = data.message;
        this.currentPage = 'login';
      });
      socket.on('registration_error', (error) => {
        this.registrationError = error;
      });
    },
    // Handles the user's login
    login() {
      // Error handling for logging in and updating the number of logged in users
      socket.emit('login', { username: this.username, password: this.password });
      socket.on('login_success', (data) => {
        this.loginMessage = data.message;
        this.currentPage = 'game';
        console.log(`User ${data.username} logged in.`);
        console.log(`Current number of logged-in users: ${this.playerCount + 1}`);
        this.playerCount++;
      });
      socket.on('login_error', (error) => {
        this.loginError = error;
      });
      socket.on('waiting_room', () => {
        this.currentPage = 'waiting';
      });
      socket.on('game_started', (data) => {
        this.currentPage = 'game';
        // Message to the user when the game begins
        this.gameStatus = `Game started! Please make your guess, ${data.username}. Guess between 1 and 50. In the event of a tie, a random winner will be chosen.`;
      });
      // Handling the submission of the guess and the final result
      socket.on('guess_submitted', (data) => {
        if (data.username === this.username) {
          this.guessSubmitted = true;
          this.yourGuess = data.guess;
        }
        this.guesses.push(data);
        if (this.guesses.length === 2) {
          this.determineGameResult();
          this.currentPage = 'result';
        }
      });
      socket.on('game_result', (data) => {
        this.gameResult = data.message;
        this.correctNumber = data.correctNumber;
      });
    },
    // Toggles the admin login form
    // Clicking it once will show the admin login form, clicking it again will hide the admin login form
    toggleAdminLogin() {
      this.showAdminLogin = !this.showAdminLogin;
    },

    // Handles the admin's login
    loginAsAdmin() {
      if (this.adminPassword === 'admin1') {
        fetch('/admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password: this.adminPassword }),
        })
          .then((response) => response.json())
          .then((users) => {
            this.adminUsers = users;
            this.currentPage = 'admin';
          })
          .catch((error) => {
            this.adminLoginError = 'Error fetching users';
          });
      } else {
        this.adminLoginError = 'Invalid password';
      }
    },

    // Switches the admin page back to the login page
    backToLogin() {
      this.currentPage = 'login';
      this.adminUsers = null;
    },

    // This is the switch to login button in the register interface
    switchToLogin() {
      this.currentPage = 'login';
    },

    // This is the switch to register button in the login interface
    switchToRegister() {
      this.currentPage = 'register';
    },

    // Handles the user's guess in the game 
    submitGuess() {
      if (this.guess !== null) {
        socket.emit('guess', { username: this.username, guess: this.guess });
        this.guess = null;
        this.guessSubmitted = true;
      }
    },

    // These determine the winner and loser, and display the appropriate message
    determineGameResult() {
      const [firstGuess, secondGuess] = this.guesses;
      this.correctNumber = firstGuess.randomNumber;

      if (firstGuess.username === this.username) {
        // Message to the winner
        this.gameResult = `You win! The correct number was: ${this.correctNumber}. You guessed ${firstGuess.guess}, while the other user guessed ${secondGuess.guess}.`;
      } else {
        // Message to the loser
        this.gameResult = `You lose. The correct number was: ${this.correctNumber}. You guessed ${secondGuess.guess}, while the other user guessed ${firstGuess.guess}.`;
      }
    },

    /*
     * The following few functions all make use of a public API
     * The API is called Open-Meteo, and it is just like OpenWeatherMap but there is no API key needed
     * It is used within the application to get weather data for cities, as well as the time and date
     */

    // Gets the current weather and time, with error handling
    fetchWeatherAndTime() {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`)
          .then((response) => response.json())
          .then((data) => {
            this.city = `${data.timezone.split('/')[1]}`;
            this.weatherCelsius = data.current_weather.temperature.toFixed(1);
            this.weatherDescription = this.getWeatherDescription(data.current_weather.weathercode);
            this.weatherIcon = this.getWeatherIcon(data.current_weather.weathercode);
            this.formattedTime = this.formatTime(new Date());
            this.formattedDate = this.formatDate(new Date());
          })
          .catch((error) => {
            console.error('Error fetching weather and time:', error);
          });
      }, (error) => {
        console.error('Error getting geolocation:', error);
      });
    },
    // Returns a description of the current weather based on the weather code
    // Each weather description has a different meaning, shown with an icon with the matching number below
    getWeatherDescription(weatherCode) {
      const descriptions = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Fog',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        56: 'Light freezing drizzle',
        57: 'Dense freezing drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        66: 'Light freezing rain',
        67: 'Heavy freezing rain',
        71: 'Slight snow fall',
        73: 'Moderate snow fall',
        75: 'Heavy snow fall',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail',
      };
      const weatherDescription = descriptions[weatherCode];
      return weatherDescription || 'Unknown';
    },

    // Returns an icon representing the current weather based on the weather code
    // Each weather code has a different meaning, explained with the matching number above
    // Note: fas fa- is the Font Awesome format
    getWeatherIcon(weatherCode) {
      const weatherIcons = {
        0: 'fas fa-sun',
        1: 'fas fa-cloud-sun',
        2: 'fas fa-cloud-sun',
        3: 'fas fa-cloud',
        45: 'fas fa-smog',
        48: 'fas fa-smog',
        51: 'fas fa-cloud-drizzle',
        53: 'fas fa-cloud-rain',
        55: 'fas fa-cloud-showers-heavy',
        56: 'fas fa-cloud-sleet',
        57: 'fas fa-cloud-sleet',
        61: 'fas fa-cloud-showers-heavy',
        63: 'fas fa-cloud-showers-heavy',
        65: 'fas fa-cloud-showers-heavy',
        66: 'fas fa-cloud-sleet',
        67: 'fas fa-cloud-sleet',
        71: 'fas fa-snowflake',
        73: 'fas fa-snowflake',
        75: 'fas fa-snowflake',
        77: 'fas fa-snowflake',
        80: 'fas fa-cloud-showers-heavy',
        81: 'fas fa-cloud-showers-heavy',
        82: 'fas fa-cloud-showers-heavy',
        85: 'fas fa-snowflake',
        86: 'fas fa-snowflake',
        95: 'fas fa-bolt',
        96: 'fas fa-bolt',
        99: 'fas fa-bolt',
      };
      const matchingIcon = weatherIcons[weatherCode];
      return matchingIcon || 'fas fa-question';
    },

    // Formats the time to be in AM/PM format (12-hour format) rather than 24-hour format (military time)
    formatTime(date) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const time = `${this.padZero(hours % 12 || 12)}:${this.padZero(minutes)}:${this.padZero(seconds)} ${ampm}`;
      return time;
    },
      
    // Formats the current date to be in words
    formatDate(date) {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const formattedDate = date.toLocaleDateString('en-US', options);
      return formattedDate;
    },

    // Adds a leading zero to a number if it's less than 10 (single digits)
    padZero(num) {
      // Adds the number for the time
      const paddedNum = num.toString().padStart(2, '0')
      return paddedNum;
    },
  },
  created() {
    socket.on('player_count', (count) => {
      // Console message that lists the current number of logged-in users
      console.log(`Current number of logged-in users: ${count}`);
      // Updates the player count
      this.playerCount = count;
    });
    // Gets the current time and weather of the user's location from that function
    this.fetchWeatherAndTime();
    // Updates the weather and time every second
    setInterval(this.fetchWeatherAndTime, 1000);
  },
});
