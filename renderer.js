const SerialPort = require('serialport');
const MockBinding = require('@serialport/binding-mock');
const Readline = require('@serialport/parser-readline');
const tableify = require('tableify');

// create a mock binding
SerialPort.Binding = MockBinding;
MockBinding.createPort('/dev/Mock');
portIsOpen = false;
/* writing to the port of the mock binding requires a buffer
  Buffer documentation: https://nodejs.org/api/buffer.html#buffer_buffer
  About writing to ports: https://serialport.io/docs/api-binding-abstract
*/
mockMessage = Buffer.from('420 69 420');

const messages = {};

//const port = new SerialPort('/dev/ttyUSB0', { // actual port
const port = new SerialPort('/dev/Mock', { // for testing
    baudRate: 115200,
    parser: SerialPort.parsers.readline
});

port.on('open', () => {
    console.log('port opened');
    port.write(mockMessage);
});

port.on('data', data => {
    console.log(data.toString());
    // const dataSplit = data.toString().split(' ');
    // messages[dataSplit[0]] = {id: dataSplit[0], data: dataSplit.slice(1, dataSplit.length - 1)};
    // console.log(messages);
});

port.binding.emitData(mockMessage); // why isn't the port open by this point?
//port.binding.write(mockMessage); // same here
