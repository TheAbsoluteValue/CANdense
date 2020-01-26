const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const tableify = require('tableify');

const port = new SerialPort('/dev/ttyUSB1', {
    baudRate: 115200,
    parser: SerialPort.parsers.readline
});

port.on('open', () => {
    console.log('port opened');
});

port.on('data', data => {
    console.log(data.toString());
});
