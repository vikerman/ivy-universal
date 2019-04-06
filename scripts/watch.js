console.log('Starting livereload server...')

let livereload = require('livereload');
let server  = livereload.createServer();

let spawn = require('child_process').spawn;

function debug(...args) {
  if (process.env['DEBUG']) {
    console.log(args);
  }
}

// Start the webpack build for client in watch mode.
debug('Starting client build...');
let clientBuild = spawn('ng', ['build', '--aot', '--watch', '--output-hashing', 'all']);
let clientBuiltOnce = false;
clientBuild.stdout.on('data', (data) => {
  if (data.toString().indexOf('chunk {main}') >= 0) {
    clientBuiltOnce = true;
  }
  debug('Client build:', data.toString());
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
  if (data.toString().indexOf('chunk {main}') >= 0) {
    serverBuiltOnce = true;
  }
  debug('Server build:', data.toString());
});

serverBuild.on('exit', (code) => {
  console.error('server build exited. Bye!!');
  process.exit(code);
});

function runNodeMon() {
  let nodemon = spawn('nodemon', ['--watch', 'dist/ivy', '--watch', 'dist/server', 'dist/server/main.js']);

  // Sent livereload whenever the Node expres server is listening on the port.
  nodemon.stdout.on('data', (data) => {
    console.log(data.toString());
    if (data.toString().indexOf('Node Express server listening') >= 0) {
      console.log('Sending livereload refresh...\n');
      server.refresh('');
    }
  });
  
  nodemon.on('exit', (code) => {
    console.error('nodemon process exited. Bye!!');
    process.exit(code);
  });  
}

let fs = require('fs');
function checkForServerBinaryAndRun() {
  if (clientBuiltOnce && serverBuiltOnce && fs.existsSync('dist/server/main.js')) {
    runNodeMon();
  } else {
    console.log('.');
    setTimeout(checkForServerBinaryAndRun, 1000);
  }
}

// Start the nodemon server when the server binary is available...
console.log('Waiting for initial build to complete');
checkForServerBinaryAndRun();
