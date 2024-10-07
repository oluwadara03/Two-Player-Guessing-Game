/*
 * This is the server code for the application
 * The application is a multiplayer (2 player) guessing game with a user weather/time/date description
 * The users must guess between 1 and 50 and the closest user wins
 */

// Import the necessary modules
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/database.db');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Set the view engine to Pug
app.set('view engine', 'pug');

// Define the root route, which renders the 'register' view
// This is the first screen you see when you open the application
app.get('/', (request, response) => {
  response.render('register');
});

// Define the login route, which renders the 'login' view
// This is done without a reload nor a URL change of the browser
app.get('/login', (request, response) => {
  response.render('login');
});

// Define the game route, which renders the 'game' view
// This is done without a reload nor a URL change of the browser
app.get('/game', (request, response) => {
  response.render('game');
});

// Define the waiting route, which renders the 'waiting' view
// This is done without a reload nor a URL change of the browser
app.get('/waiting', (request, response) => {
  response.render('waiting');
});

// Initialization of variables
let connectedPlayers = [];
let currentGame = null;

// Handle WebSocket connections
// This lets the console know that someone joined, but it does not specify who
io.on('connection', (socket) => {
  console.log('A user connected');

  // Handling the 'register' event
  socket.on('register', (data) => {
    // Check if the username is already taken
    db.get('SELECT * FROM users WHERE username =?', [data.username], (error, row) => {
      if (row) {
        // If the username is taken, the user will get a warning message
        socket.emit('registration_error', 'Username already taken.');
      } else {
        // If the username is available, insert the new user into the database
        // The user's username, password and role of guest are stores in the database
        db.run('INSERT INTO users (username, password, role) VALUES (?,?,?)', [data.username, data.password, 'guest'], (error) => {
          if (error) {
            // If there's an error in the registration, the user will get a warning message
            socket.emit('registration_error', 'Username or password must be at least 6 characters long.');
          } else {
            // If the registration is successful, the console returns a welcome message
            socket.emit('registration_success', { message: `Welcome, ${data.username}!` });
          }
        });
      }
    });
  });

  // Handling the 'login' event
  socket.on('login', (data) => {
    // Check if the username and password are valid
    db.get('SELECT * FROM users WHERE username =? AND password =?', [data.username, data.password], (error, row) => {
      if (error || !row) {
        // If the login is unsuccessful, the user is shown an error message 
        socket.emit('login_error', 'Invalid username or password.');
      } else {
        // If the login is successful, add the user to the connectedPlayers array
        connectedPlayers.push({ socket, username: row.username, role: row.role, randomNumber: null });
        // The console returns a welcome message
        socket.emit('login_success', { username: row.username, role: row.role, message: `Welcome back, ${row.username}!` });
        console.log(`User ${row.username} logged in.`);
        console.log(`Current number of logged-in users: ${connectedPlayers.length}`);
        io.emit('player_count', connectedPlayers.length);

        // If there is only one player, the user is sent to the waiting room
        if (connectedPlayers.length === 1) {
          socket.emit('waiting_room');
        } 
        // If there are two players, start the game
        else if (connectedPlayers.length === 2) {
          startGame(connectedPlayers);
        }
      }
    });
  });

  // Handling the 'guess' event
  socket.on('guess', (data) => {
    if (currentGame) {
      const guess = parseInt(data.guess);
      // Validate the guess
      // The guess must be in between the bounds of 1 and 50 inclusive
      if (guess < 1 || guess > 50) {
        // The user gets an error message warning
        socket.emit('guess_error', 'Guess must be between 1 and 50.');
        return;
      }
      const randomNumber = currentGame.randomNumber;
      let result;
      // Determine the result of the guess
      if (guess === randomNumber) {
        // The number is exactly correct
        result = `${data.username} guessed the correct number!`;
        console.log(result);
      } else if (guess < randomNumber) {
        result = `${data.username}'s guess is lower than the result.`;
        console.log(result);
      } else {
        result = `${data.username}'s guess is higher than the result.`;
        console.log(result);
      }
      // Add the guess to the currentGame.guesses array
      currentGame.guesses.push({ username: data.username, guess: data.guess, randomNumber: randomNumber, result: result });
      io.emit('guess_submitted', { username: data.username, guess: data.guess, randomNumber: randomNumber, result: result });
      // If both players have guessed, then the results will be shown, along with resetting the currentGame and connectedPlayers arrays
      if (currentGame.guesses.length === 2) {
        io.emit('game_result');
        currentGame = null;
        connectedPlayers = [];
      }
    }
  });

  // Handling the 'disconnect' event
  socket.on('disconnect', () => {
    console.log('A user disconnected');
    // Remove the disconnected player from the connectedPlayers array
    // The count of users is reduced by 1
    connectedPlayers = connectedPlayers.filter((player) => player.socket !== socket);
    io.emit('player_count', connectedPlayers.length);
    // If the disconnected player was part of the current game, reset the currentGame
    if (currentGame && currentGame.players.some((player) => player.socket === socket)) {
      currentGame = null;
    }
  });
});

// Function to start a new game
function startGame(players) {
  // Generate a random number between 1 and 50
  const randomNumber = Math.trunc(Math.random() * 50) + 1;

  // Create a new currentGame object
  currentGame = { players, guesses: [], randomNumber, };

  // Both users will be transported to the game
  players.forEach((player) => {
    io.to(player.socket.id).emit('game_started', { username: player.username });
  });
}

// Define an admin route that returns a list of users
app.post('/admin', (request, response) => {
  // Check if the password is correct
  if (request.body.password === 'admin1') {
    // If the password is correct, retrieve all users from the database and send them as a JSON response
    db.all('SELECT * FROM users', (error, rows) => {
      if (error) {
        response.status(500).send('Cannot get users');
      } else {
        response.json(rows);
      }
    });
  } else {
    // If the password is incorrect, send an error response to the user
    // The user will have to enter a new password
    response.status(401).send('Invalid password');
  }
});

// Start the server and create the users table if it doesn't exist
http.listen(3000, () => {

  // There is a clickable link in the console to run the code
  console.log('Server listening on port 3000. To test, click the URL below.');
  console.log('http://localhost:3000/');

  db.serialize(() => {
    // Creating the database table to store the data if it does not yet exist
    db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT, role TEXT)');
  });
});