const SerialPort = require('serialport');
const MockBinding = require('@serialport/binding-mock');

// set up the port to which we write to
SerialPort.Binding = MockBinding;
MockBinding.createPort('PORT_PATH', {
  echo: true,
  record: false
});
const port = new SerialPort('PORT_PATH', {
  baudRate: 115200,
  highWaterMark: 90 // max buffer size of the port
});

// returns true if the input is a valid hexadecimal number
function isValidHex(string) {
  let hex = /^[0-9a-f]+$/i;
  console.log(hex.test(string));
  return hex.test(string);
}

// write to port when button is pushed
document.getElementById('transmit-btn').addEventListener('click', () => {
  // the ID for the message that the user wants to transmit (required)
  let id = document.getElementById('transmit-id').value;
  try {
    if (!isValidHex(id)) {throw "ID is not valid hex";}
  } catch(err) {
    // TODO: indicate to user that the ID isn't right
    alert('ID INVALID');
    return; // to prevent further execution (transmitting of invalid data)
  }
  // the data field for the message that the user wants to transmit (required)
  let data = document.getElementById('transmit-data').value;
  try {
    if (!isValidHex(data)) {throw "data is not valid hex";}
  } catch(err) {
    // TODO: indicate to user that the data field isn't right
    alert('DATA INVALID');
    return; // to prevent further execution (transmitting of invalid data)

  }
  // the interval at which the user wants to transmit the message (in ms) (optional, defaults to 1000ms)
  let interval = document.getElementById('transmit-interval').value;
  if (!interval || interval < 1) {interval = 1000}
  // the number of times the user wants to transmit the message (defaults to 1)
  let count = document.getElementById('transmit-count').value;
  if (!count || count < 1) {count = 1}
  let transmissionString = `${id}#${data}`;

  /*
  The normal setInterval() function also adds the delay before the first call.
  This function first calls the function immediately (to avoid the initial delay),
  then sets the interval at the specified time.
  */
  function setIntervalAndCallImmediately(f, interval) {
    if (id && data) {
      f();  // the initial call (to avoid the initial delay)
      count--;
      timeoutID = setInterval(() => {
        if (count > 0) {
          f();
          count--;
        } else {
          clearInterval(timeoutID); // stop the interval calls
        }
      }, interval);
    }
  }

  setIntervalAndCallImmediately(() => {
    port.write(transmissionString);
  }, interval);
});
