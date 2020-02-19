const SerialPort = require('serialport');
const MockBinding = require('@serialport/binding-mock');
const Readline = require('@serialport/parser-readline');
const tableify = require('tableify');
const fs = require('fs');
//const stream = require('stream');s

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

console.log(port.on('open', () => {
    console.log('Incoming data port opened.');
}));

c = 0;
port.on('data', data => {
  lineSplit = data.toString().split('\n');
  console.log(lineSplit);
  lineSplit.forEach(item => {
    //const dataSplit = data.toString().split(' ');
    c++;
    if (c <= 1) {
      console.log(`SPLIT ${c}: ${item.toString()}`);
    }
  });
});

logFile = fs.createReadStream('test_CANdump1_abbreviated.log');
logFile.on('open', () => {
  console.log('CAN dump log opened.\n\n\n\n');
});
logFile.on('ready', () => {
  console.log('CAN dump reader is ready.');
  logFile.pipe(port);
});

sum = 0;
logFile.on('data', data => {
  port.read(Buffer.from(data)); // meaning port will receive whatever data is
});
