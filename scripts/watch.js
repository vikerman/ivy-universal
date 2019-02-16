console.log('Starting livereload server...')

let livereload = require('livereload');
let server  = livereload.createServer();

// Express server
let express = require('express');
const app = express();

const ERROR_PORT = process.env.ERROR_PORT || 8888;

let spawn = require('child_process').spawn;

function debug(...args) {
  if (process.env['DEBUG']) {
    console.log.apply(console, args);
  }
}

// Report errors through an API endpoint.
let clientErrors = [];
let lameDuck = false;
app.get('/', (req, res) => {
  res.status = 200;
  res.send(JSON.stringify(clientErrors));
});

app.listen(ERROR_PORT);

// Start the webpack build for client in watch mode.
debug('Starting client build...');
let clientBuild = spawn('ng', ['build', '--aot', '--watch', '--output-hashing', 'all']);
let clientBuiltOnce = false;
clientBuild.stdout.on('data', (data) => {
  if (data.toString().indexOf('Date:') >= 0) {
    clientBuiltOnce = true;
    if (clientErrors.length > 0) {
      debug('Went from ERROR to NO-ERROR state. Doing live-reload');
      server.refresh('/');
    }
    clientErrors = [];
    if (lameDuck) {
      debug('Starting nodemon...')
      lameDuck = false;
      checkForServerBinaryAndRun();
    }
  }
  debug('Client build:', data.toString());
});

clientBuild.stderr.on('data', (data) => {
  data = data.toString().trim();
  debug('Client Error:', data);
  if (/^ERROR in/.test(data)) {
    clientErrors = [data.substr(9)];
    debug('Went from NO-ERROR to ERROR state. Doing live-reload')
    server.refresh('/');
  }
});

clientBuild.on('exit', (code) => {
  console.error('client build exited. Bye!!');
  process.exit(code);
});

// Start the webpack build for server in watch mode.
debug('Starting server build...');
let serverBuild = spawn('ng', ['run', 'ivy:server', '--watch']);
let serverBuiltOnce = false;
serverBuild.stdout.on('data', (data) => {
  if (data.toString().indexOf('Date:') >= 0) {
    serverBuiltOnce = true;
  }
  debug('Server build:', data.toString());
});

serverBuild.on('exit', (code) => {
  console.error('server build exited. Bye!!');
  process.exit(code);
});

function runNodeMon() {
  let nodemon = spawn('nodemon', ['--watch', 'dist/server', 'dist/server/main.js']);

  // Sent livereload whenever the Node expres server is listening on the port.
  nodemon.stdout.on('data', (data) => {
    data = data.toString();
    console.log(data);
    if (data.indexOf('Node Express server listening') >= 0) {
      console.log('Sending livereload refresh...\n');
      server.refresh('/');
    }
  });

  nodemon.stderr.on('data', (data) => {
    data = data.toString();
    debug('nodemon error', data);
  });
  
  nodemon.on('exit', (code) => {
    console.error('nodemon process exited. Bye!!');
    process.exit(code);
  });  
}

let fs = require('fs');
function checkForServerBinaryAndRun() {
  if (clientBuiltOnce && serverBuiltOnce) {
    if (!fs.existsSync('dist/server/main.js') && clientErrors.length > 0) {
      clientErrors.forEach(msg => console.error(msg, '\n'));
      debug('Entering lame duck mode...')
      lameDuck = true;
    } else {
      runNodeMon();
    }
  } else {
    console.log('.');
    setTimeout(checkForServerBinaryAndRun, 1000);
  }
}

// Start the nodemon server when the server binary is available...
console.log('Waiting for initial build to complete');
checkForServerBinaryAndRun();
