const SerialPort = require('serialport');
const MockBinding = require('@serialport/binding-mock');
const Readline = require('@serialport/parser-readline');
const fs = require('fs');
const tableify = require('tableify');

const messages = {};

/* create the binding **/
SerialPort.Binding = MockBinding;
// if echo is false, then port.on('data', ...) won't fire
MockBinding.createPort('PORT_PATH', {echo: true, record: false});
//const port = new SerialPort('/dev/ttyUSB0', { // actual port
const port = new SerialPort('PORT_PATH', { // for testing
    baudRate: 115200,
    parser: SerialPort.parsers.readline
});

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

/*
  How data is read in and parsed:
  ReadStream (only when reading the log file) => port => parser
  We use the ReadStream to read from the log file. This won't be done when reading live from
  a car. The data that comes in to the port, whether from a log file or directly from the CAN
  bus is place in to a buffer. At times, a message will overflow in to the next buffer. By piping
  the port in to the ReadLine parser, we eliminate this problem because it only emits data once a
  newline is encountered– not when the buffer is full.
 */
 // creates the ReadLine parser, which is the final destination for the data
 const parser = port.pipe(new Readline());
 let counter = 0;
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

     messages[id] = {"id": id, "data": messageData, "timestamp": timeString};

     // create table from JSON data array
     var messageHTML = tableify(messages);
     document.getElementById("table").innerHTML = messageHTML;
   }


   // dataJson.data.push({"ID": id,
   //                     "message": messageData,
   //                     "time": timeString,
   //                     "count": 1});
   // var title = dataJson['title'];
   // var note = dataJson['note'];
   // var message = dataJson['data'];



   // write to DOM
   // document.getElementById("carMake").innerHTML = title ? title : 'CanDense';
   // document.getElementById("notes").innerHTML = note ? note : 'notes';
   // document.getElementById("table").innerHTML = html;
 });


 // once the serial port is open, we add a pipe in to the parser
 port.on('open', () => {
   port.pipe(parser);
 });


 // create the ReadStream (only useful when reading from a log file)
 logFile = fs.createReadStream('test_CANdump1.log');
 logFile.on('open', () => {
   logFile.pipe(port);  // send all data to the port
 });

sum = 0;
logFile.on('data', data => {
  port.read(Buffer.from(data)); // meaning port will receive whatever data is
});
