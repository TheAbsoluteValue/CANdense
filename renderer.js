const SerialPort = require('serialport');
const MockBinding = require('@serialport/binding-mock');
// const Readline = require('@serialport/parser-readline');
const tableify = require('tableify');
const readline = require('readline');
const fs = require('fs');  // for creating a file stream (fs.ReadStream)

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

port.on('open', () => {
    console.log('port opened');
});

// write message to buffer
//mockMessage = Buffer.from('420 69 69420');
//port.write(mockMessage);//, () => {
  //console.log('Message written successfully!');
  //console.log('Last write: ', port.binding.lastWrite.toString('utf8'));
//})

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

// const readStream = fs.createReadStream('test_CANdump1.log');
// readStream.on('data', data => {
//   data.toString().split('\n').forEach(line => {
//     const a = line.split(' ');
//     port.write(a);
//     });
// });

// read the test CAN dump line by line and then write to the data port
const rl = readline.createInterface({
  input: fs.createReadStream('test_CANdump1.log')
});

rl.on('line', (message) => {
  // Why is this writing a bunch of lines when calling port.write?????
  port.write(Buffer.from(message));
});


// have the port pretend like it received data (without actually calling port, write, I think)
//port.binding.emitData(mockMessage);
