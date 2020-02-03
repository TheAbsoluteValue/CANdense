const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const tableify = require('tableify');

const messages = {};

const port = new SerialPort('/dev/ttyUSB0', {
    baudRate: 115200,
    parser: SerialPort.parsers.readline
});

port.on('open', () => {
    console.log('port opened');
});

port.on('data', data => {
    // console.log(data.toString());
    const dataSplit = data.toString().split(' ');
    messages[dataSplit[0]] = {id: dataSplit[0], data: dataSplit.slice(1, dataSplit.length - 1)};
    console.log(messages);
});
