# Two-Player-Guessing-Game

VIDEO DEMONSTRATION: The video demonstration is located at the following link: https://youtu.be/QfoK3

INSTALL INSTRUCTIONS: 
-  If you do not have node.js installed on your computer, set up your machine by installing node.js and npm from the node.js website. To test that these are installed, open a command terminal and enter "node -v" and then "npm -v". 
- If you do not have SQLite installed, head over to the following site: https://www.sqlite.org/download.html and download the correct version for your computer. Once installed, you may feel free to do some basic examples from the SQLite documentation page (https://www.sqlite.org/cli.html) to make sure things are working correctly, and to see some of the basic commands in SQLite. 
- You will need the package.json and package-lock.json files. To do this, enter "npm init -y" command first and make sure to initialize this properly.
- Finally, you will need to install the necessary external code modules. Run the following command in your terminal: "npm install express http pug socket.io sqlite3 vue font-awesome". This will install all of the necessary modules.

LAUNCH INSTRUCTIONS: Enter "node server.js" or "npm test" once in the correct folder. This should show a URL in the console/terminal.

TESTING INSTRUCTIONS (URL): To test the code, once you have launched the code with the step above, open a two different browser windows and try the following URL: "http://localhost:3000/". There are many things you can try:

- Weather, Time, and Date - Allow the browser to access your location if you want this to show on the bottom corner. This makes use of a public API called Open-Meteo, which is a free weather API that does not require an API key (unlike OpenWeatherMap).
- Creating an account - There is a register interface where you can enter a username and password to create an account. If it is successful, you will be transported to the login page, where you can just press login if you want to login.
- Logging into an account - If you have a pre-existing account that you want to log into, you can go to the login interface and log in there. Make sure you enter in the correct information to your account. Logging in this way is will log you in as a guest account.
- Logging into an admin account - There is an admin user button at the bottom of the login page, which allows you to login as an admin and see the username, password, and role of each user in a table format. Click the button and enter the password. The password is "admin1".
- Playing the game - You can play the game if there are two different browers/devices logged into the application. Guess a number between 1 and 50 and see if you win!

NOTE: I have left my usernames and passwords on the database, feel free to delete the file and restart or use them to login and play.
