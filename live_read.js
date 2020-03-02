const SerialPort = require('serialport');
const MockBinding = require('@serialport/binding-mock');
const Readline = require('@serialport/parser-readline');
const fs = require('fs');
const tableify = require('tableify');

const messages = {};
let readToggle = false; // whether we are reading data or not

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

// create the port
SerialPort.Binding = MockBinding;
// if echo is false, then port.on('data', ...) won't fire
MockBinding.createPort('PORT_PATH', {echo: true, record: false});
//const port = new SerialPort('/dev/ttyUSB0', { // REAL port
const port = new SerialPort('PORT_PATH', { // TESTING port
    baudRate: 115200,
    parser: SerialPort.parsers.readline,
    highWaterMark: 90  // 90 bytes read before flushing buffer
});

// ReadStream to read from logFile (test only)
logFile = fs.createReadStream('test_CANdump1.log');

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
  const parser = port.pipe(new Readline());
  parser.on('data', data => {
    let dataSplit = data.toString().split(' ');
    // TODO: this is if(...) just a bandaid; sometimes dataSolut[2] is undefined... not sure why
    if (dataSplit[2]) {
      // get the ID and message data
      let id = dataSplit[2].slice(0, 3);
      let messageData = dataSplit[2].slice(4);

      // make the time stamp human-readable
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

function toggleBtnPressed() {
  if (readToggle){  // we are reading, so we pause reading
    readToggle = false;
    // when pausing, the button now needs to tell user they can start reading again
    toggleBtn.innerHTML = "<button onclick='toggleBtnPressed()' id='toggleBtn'>Start Reading</button>";
    pauseReading();
    alert("PAUSED");
  } else {  // we are not reading, so we start reading
    readToggle = true;
    // when resuming read, the button now needs to tell user they can pause reading again
    toggleBtn.innerHTML = "<button onclick='toggleBtnPressed()' id='toggleBtn'>Pause Reading</button>";
    startReading();
    alert("RESUMED");
  }
}

document.getElementById("toggleBtn").addEventListener("click", toggleBtnPressed);
