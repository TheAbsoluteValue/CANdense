const SerialPort = require('serialport');
const MockBinding = require('@serialport/binding-mock');
const Readline = require('@serialport/parser-readline');
const tableify = require('tableify');
const fs = require('fs');  // for creating a file stream (fs.ReadStream)

const messages = {};

console.log('WTF');

/* create the binding **/
SerialPort.Binding = MockBinding;
// if echo is false, then port.on('data', ...) won't fire
MockBinding.createPort('PORT_PATH', {echo: true, record: false});
//const port = new SerialPort('/dev/ttyUSB0', { // actual port
const port = new SerialPort('PORT_PATH', { // for testing
    baudRate: 115200,
    parser: SerialPort.parsers.readline
});

port.on('open', () => {
    console.log('port opened');
});

numdata = 0;
port.on('data', data => {
  //rl.pause();
  console.log(`Received data ${numdata}: `, data.toString());
  console.log('ENDDATA\n\n');
  numdata++;
  //setTimeout(() => {rl.resume}, 2000);

  // const dataSplit = data.toString().split(' ');
  // messages[dataSplit[0]] = {id: dataSplit[0], data: dataSplit.slice(1, dataSplit.length - 1)};
  // console.log(messages);
});

const readStream = fs.createReadStream('test_CANdump1.log');
readStream.on('data', data => {
    port.write(Buffer.from("LINE" + data.toString())); // what????
    data.toString().split('\n').forEach(partition => {
    // port.write(Buffer.from(partition));
    console.log("PARTITION: ", partition[0], partition[2]);
  })});


  //port.write(Buffer.from(data));
  // data.toString().split('\n').forEach(line => {
  //   const a = line.split(' ');
  //   port.write(Buffer.from(a));
  //   });
// });

// read the test CAN dump line by line and then write to the data port
const rl = require('readline').createInterface({
  input: fs.createReadStream('test_CANdump1.log')
});

// rl.on('line', (message) => {
//   message.split('\n').forEach(message => {
//     port.write(Buffer.from(message));
//   });
// });
