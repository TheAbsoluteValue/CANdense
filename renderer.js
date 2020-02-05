const SerialPort = require('serialport');
const MockBinding = require('@serialport/binding-mock');
const Readline = require('@serialport/parser-readline');
const tableify = require('tableify');

SerialPort.Binding = MockBinding;

const messages = {};

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
mockMessage = Buffer.from('420 69 69420');
port.write(mockMessage)//, () => {
  //console.log('Message written successfully!');
  //console.log('Last write: ', port.binding.lastWrite.toString('utf8'));
//})

port.on('data', data => {
    console.log('Received some data:\n\t', data.toString());
    const dataSplit = data.toString().split(' ');
    messages[dataSplit[0]] = {id: dataSplit[0], data: dataSplit.slice(1, dataSplit.length - 1)};
    console.log(messages);
});

// have the port pretend like it received data (without actually calling port, write, I think)
//port.binding.emitData(mockMessage);
