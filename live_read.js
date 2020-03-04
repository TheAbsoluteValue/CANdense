isRecordingconst SerialPort = require('serialport');
const MockBinding = require('@serialport/binding-mock');
const Readline = require('@serialport/parser-readline');
const fs = require('fs');
const tableify = require('tableify');

/*
	This object holds one entry for each ID, where it is updated when another message with the
	same id is received. Holds the ID, data, timestamp, and count of each message. Is what the table
	is built from.
*/
const messages = {};
const TEST_LOG_PATH = 'test_CANdump1.log';
const TEST_MODE = true;  // set to false if connecting to real vehichle
let loggingLocation;  // path messages will be recorded at
let logMode;  // if the user wants to append to or truncate that log file
let fd;  // file descriptor (check docs for fs.open(...) return value)
let recordingFileStream;  // the stream that is being used to record messages
let readToggle = false; // whether we are reading data or not
let isRecording = false; // wheter we are logging data or not
let toggleReadBtn = document.getElementById('toggleReadBtn');
let toggleRecordBtn = document.getElementById('toggleRecordBtn');

var dataJson = {
	"_id": "1",
	"title": "2010 Honda Accord",
	"data": [{
		"ID": "1",
		"message": "some data",
		"time": "UTC",
		"count": 1
	}],
	"label": "",
	"note": ""
};

// begin creating the port
SerialPort.Binding = MockBinding;
// if echo is false, then port.on('data', ...) won't fire
MockBinding.createPort('PORT_PATH', {echo: true, record: false});
//const port = new SerialPort('/dev/ttyUSB0', { // use instead of the previous line with real car
const port = new SerialPort('PORT_PATH', { // TESTING port
    baudRate: 115200,
    parser: SerialPort.parsers.readline,  // need to split messages at each line
    highWaterMark: 90  										// max buffer size of the port
});

// create the parser that emits data at the newline (how our messages are delimited)
const parser = port.pipe(new Readline());

// ReadStream to read from logFile (test only)
logFile = fs.createReadStream(TEST_LOG_PATH,
  {highWaterMark: 90} // max size to buffer when reading from the file
);

/*
  How data is read in and parsed:
  ReadStream (only when reading the log file) => port => parser
  We use the ReadStream to read from the log file. This won't be done when reading live from
  a car. The data that comes in to the port, whether from a log file or directly from the CAN
  bus is place in to a buffer. At times, a message will overflow in to the next buffer. By piping
  the port in to the ReadLine parser, we eliminate this problem because it only emits data once a
  newline is encountered– not when the buffer is full.
 */
function startReading() {
  // creates the ReadLine parser, which is the final destination for the data
  parser.on('data', data => {
    let dataSplit = data.toString().split(' ');
    // TODO: this is if(...) just a bandaid; sometimes dataSolut[2] is undefined... not sure why
    if (dataSplit[2]) {
      // get the ID and message data
      let id = dataSplit[2].slice(0, 3);
      let messageData = dataSplit[2].slice(4);

      // make the time stamp dhuman-readable
      let unixTimeStamp = dataSplit[0].slice(1, -1);
      let date = new Date(parseFloat(unixTimeStamp));
      let hours = date.getHours();
      let minutes = date.getMinutes();
      let seconds = date.getSeconds();
      let milliseconds = date.getMilliseconds();
      let arr = [hours, minutes, seconds, milliseconds];
      let timeString = [hours, minutes, seconds, milliseconds].join(':');

      // increment the count of the id if it occurs again
      let messageCount = messages[id] ? messages[id]["count"] : 0;
      messages[id] = {"id": id, "data": messageData, "timestamp": timeString, "count": ++messageCount};
      // create table from JSON data array
      var messageHTML = tableify(messages);
      document.getElementById("table").innerHTML = messageHTML;
    }
  });

  // once the port opens, we pipe it to the readline parser
  port.pipe(parser);

  // create the file reader (only for demo purposes)
  logFile.pipe(port);  // send all data to the port
}

function pauseReading() {
  logFile.unpipe();
  port.unpipe();
}

// onclick for #toggleReadBtn (live_read.html)
// TODO: change this so that we add event listener in JS rather than HTML
function toggleReadBtnPressed() {
  if (readToggle){  // we are reading, so this block pauses the read
    readToggle = false;
    if (isRecording) {toggleRecordBtnPressed();}  // stop writing when we stop reading
    // when pausing, the button now needs to tell user they can start reading again
    toggleReadBtn.innerHTML = "Resume reading";
    setTimeout(pauseReading, 0);
  } else {  // we are not reading, so we start reading
    isReading = true;
    // when resuming read, the button now needs to tell user they can pause reading again
    toggleReadBtn.innerHTML = "Pause reading";
    setTimeout(startReading, 0);
  }
}

/*
  sets up the file that the user wants to record logs to
  is called when the user clicks the button next to the text box for
  specifying the path, or if the user tries to record before the function
  has been called
*/
function setupRecorder() {
  loggingLocation = document.getElementById("logfile-path").value;
  // if the user hasn't entered a file name, generate one by default
  if (!loggingLocation) {loggingLocation = `logs/CAN_${Date.now()}.log`;}
  if (!loggingLocation.endsWith('.log')) {
    loggingLocation = loggingLocation.concat('.log');
  }
  logMode = document.querySelector('input[name="log-mode"]:checked').value;
  fd = fs.openSync(loggingLocation, logMode);
}

// called from toggleRecordBtnPressed
function startRecording() {
  if (!recordingFileStream) {
    recordingFileStream = fs.createWriteStream(null, {fd: fd});
    recordingFileStream.on('data', data => {
      fs.writeFile(fd, data);
    });
  }
  parser.pipe(recordingFileStream);
}

// stop writing from the input to the file; used to end reading the stream
function pauseRecording() {
  parser.unpipe(recordingFileStream);
}

// takes care of cleaning things up when the user is done recording
function endRecording() {
  pauseRecording();
	// prevent memory leak
  recordingFileStream.end();
  fs.closeSync(fd);
}

// onclick for #toggleRecordBtn (live_read.html)
// TODO: change this so that we add event listener in JS rather than HTML
function toggleRecordBtnPressed() {
  if (isRecording) {  // we are recording, so pause
    isRecording = false;
    toggleRecordBtn.innerHTML = "Resume recording";
    setTimeout(0, pauseRecording);  // TODO: see if this setTimeout is really necessary (doubt it)
  } else {  // we aren't recording, so resume/start recording
      isRecording = true;
      toggleRecordBtn.innerHTML = "Pause recording";
      if (!loggingLocation) {setupRecorder();}
			// if we are logging we also ought to be reading (right?)
      if (!readToggle) {toggleReadBtnPressed();}
      startRecording();
  }
}
