const SerialPort = require('serialport');
const MockBinding = require('@serialport/binding-mock'); 
const fs = require('fs'); //NodeJS File System
const tableify = require('tableify'); //For HTML Tables
const parsers = SerialPort.parsers; //For the Port Parser
var remote = require('electron').remote, arguments = remote.getGlobal('mode').prop1; //gather the mode (test or empty where emtpy is normal run)
var mode = arguments[2];
const TEST_LOG_PATH = 'test_CANdump1.log'; //Path to the test input file representing the Fake Car for the Mock Port

//Holds the latest copy message of each unique id/label
const messages = {};
//Files and locations
let pathToPort = ' '; //empty pending which operating system
let pathToLog; //Uninitialized pending call to setUplogging
let fd;  // file descriptor, integer id representing the file returned by fs.openSync()
let logStream;  //output stream to pathToLog
//Current state flags
let isReading = false; 
let isLogging = false; 
let isFilterable = true; //False when live reading to prevent filters colliding with live data
//Buttons!
let toggleReadBtn = document.getElementById('toggleReadBtn');
let toggleLogBtn = document.getElementById('toggleLogBtn');

//Check if this is testing or standard run
if(mode && mode == 'test') {
  //Create the Mock Port
  SerialPort.Binding = MockBinding;
  MockBinding.createPort(pathToPort, {echo: true, Log: false}); // if echo is false, then port.on('data', ...) won't fire
  // Read the input file "fake car"
  var logFile = fs.createReadStream(TEST_LOG_PATH);
}
else {
  SerialPort.list().then(ports => { // This will list all devices and filter the microcontroller
  const myList = ports.filter(port => port.manufacturer === "Silicon Labs");

    if (!myList.length) {
      console.log("Device not found");
    }
    else {
      pathToPort = myList[0].path;
    }
  });
}

//Create the Port and Parser, and Pipe them together
const port = new SerialPort(pathToPort);
const parser = new parsers.Readline({ 
  delimiter: '\r\n', //Readline Parser delimited on "carriage return newline" characters 
});
port.pipe(parser);

/*
==============================================================================================================
--------------------------Reading-----------------------------------------------------------------------------
==============================================================================================================
*/

//handle the toggle between reading and not reading
function toggleReadBtnPressed() {
  if (!isReading){ // if we are not reading  
    toggleReadBtn.innerHTML = "Pause reading"; //Toggle the button text
    startReading();
  } 
  else {  //else we are reading, set the state and pauseReading
    toggleReadBtn.innerHTML = "Resume reading"; //Toggle the button text
    pauseReading();
    if (isLogging) {toggleLogBtnPressed();}  //if we are logging, stop
  }
}

//Called when the toggleReadBtn is clicked with isReading==false
function startReading() {
  isReading = true;
  isFilterable = false;

  //If test, then pipe the logFile to port
  if(mode && mode == 'test') {
    logFile.pipe(port);
  }

  //Sets what to do with each line read, data is a single line read in
  parser.on('data', data => {
    //Split the line into its component parts
    let dataSplit = data.toString().split(' '); //initial split
    if(dataSplit[0].includes("READY")) {dataSplit[0] = dataSplit[0].slice(5);} //Scrub the emitted READY message from the CAN messages
    let unixTimeStamp = dataSplit[0].slice(1, -1); //Gather the timestamp, slicing off the surrounding parentheses
    let id = dataSplit[2].slice(0, 3); //Gather the id, first three characters of the data payload
    let messageData = dataSplit[2].slice(4); //Gather the data, The rest of the data payload after the 4th character
    
    //Change timestamp from unixtime to hr:min:sec:ms
    let date = new Date(parseFloat(unixTimeStamp));
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    let milliseconds = date.getMilliseconds();
    let timeString = [hours, minutes, seconds, milliseconds].join(':');

    //Gather the current count
    let messageCount = messages[id] ? messages[id]["count"] : 0;

    //Set the current message for the id whether a new id or refreshing an already seen id
    messages[id] = {"id": id, "data": messageData, "timestamp": timeString, "count": ++messageCount};

    //Create the table and send to the HTML page
    var messageHTML = tableify(messages);
    document.getElementById("table").innerHTML = messageHTML;
  });
}

//Called when the toggleReadBtn is clicked with isReading==true, make filterable and unpipe
function pauseReading() {
  isReading = false;
  isFilterable = true; 
  logFile.unpipe();
  port.unpipe();
}

/*
==============================================================================================================
--------------------------Logging-----------------------------------------------------------------------------
==============================================================================================================
*/

//Handle the toggle between logging and not
function toggleLogBtnPressed() {
	if (!isLogging) {  //if we are not logging
    toggleLogBtn.innerHTML = "Pause Logging"; //Toggle the button text
    if (!pathToLog) {setUpLogger();} //If the log path is not setup, set it up
    if (!isReading) {toggleReadBtnPressed();} //If we are not reading yet
    startLogger();
  } 
  else {  //else we are logging
    toggleLogBtn.innerHTML = "Resume Logging"; //Toggle the button text
    pauseLogger();
  }
}

//Handle the setup for the log file output, called by setLogbtn on click and toggleLogBtnPressed
function setUpLogger() {
  pathToLog = document.getElementById("logfile-path").value; //Grab the entered logFile Name
  if (!pathToLog) {pathToLog = `log\\CAN_${Date.now()}.log`;} //If no logFile name was entered
  if (!pathToLog.endsWith('.log')) {pathToLog = pathToLog.concat('.log');} //If there is no file ending entered or improper, add it
  fd = fs.openSync(pathToLog, 'w'); // truncate
}

//Handles the writing and piping
function startLogger() {
  isLogging = true;
  if (!logStream) { //Create the writeStream if there isn't one
    logStream = fs.createWriteStream(null, {fd: fd});
    logStream.on('data', data => {
      fs.writeFile(fd, data + "\n");
    });
  }
  parser.pipe(logStream); //pipe the parser to the writeStream
}

// stop writing from the input to the file; used to end reading the stream
function pauseLogger() {
  isLogging = false;
  parser.unpipe(logStream);
}

// takes care of cleaning things up when the user is done logging
function endLogger() {
  pauseLogger();
  toggleLogBtn.innerHTML = "Start Logging";
  logStream.end(); // prevent memory leak

  alert("Log Saved!");
}

function endPage() {
  if(isLogging) {
    endLogger();
  }
  else if(isReading) {
    pauseReading();
  }
}

/*
==============================================================================================================
--------------------------Filtering---------------------------------------------------------------------------
==============================================================================================================
*/

