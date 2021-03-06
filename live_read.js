const SerialPort = require('serialport');
const MockBinding = require('@serialport/binding-mock');
const fs = require('fs'); //NodeJS File System
const tableify = require('tableify'); //For HTML Tables
const parsers = SerialPort.parsers; //For the Port Parser
var remote = require('electron').remote, arguments = remote.getGlobal('mode').prop1; //gather the mode (test or empty where emtpy is normal run)
var mode = arguments[2];
const TEST_LOG_PATH = 'test_CANdump1.log'; //Path to the test input file representing the Fake Car for the Mock Port

//Holds the latest copy message of each unique id/label
const messages = {};
let dataValues = {};
let filteredMessages = {};
let labeledIDs = {};
let labels = [];
let ids = [];
let selectedVehicle;
//Files and locations
let pathToPort = ' '; //empty pending which operating system
let pathToLog; //Uninitialized pending call to setUplogging
let vehiclesJSON; //vehicles.json
let logStream;  //output stream to pathToLog
//Current state flags
let isReading = false;
let isLogging = false;
let isFilterable = true; //False when live reading to prevent filters colliding with live data
let and = false;
//Buttons and inputs!
let toggleReadBtn = document.getElementById('toggleReadBtn');
let toggleLogBtn = document.getElementById('toggleLogBtn');
let modal = document.getElementById("myModal");
let vehicleNameIn = document.getElementById("vehicle-name");
let vehicleDropDown = document.getElementById("vehicle-profile-name");
let idInput = document.getElementById("id-input");
let labelInput = document.getElementById("label-input");
let idFilterInput = document.getElementById("id-filter");
let frequencyInput = document.getElementById("msg-freq-filter");
let toleranceInput = document.getElementById("msg-freq-tolerance");
let timeInput = document.getElementById("time-filter");
let dataInput = document.getElementById("data-val-filter");


retrieveVehicles();

//Check if this is testing or standard run
if(mode && mode == 'test') {
  //Create the Mock Port
  SerialPort.Binding = MockBinding;
  MockBinding.createPort(pathToPort, {echo: true, Log: false}); // if echo is false, then port.on('data', ...) won't fire
  // Read the input file "fake car"
  var logFile = fs.createReadStream(TEST_LOG_PATH);
}
else {
  SerialPort.list().then(ports => { // This will list all devices and filter the microcontroller
  const myList = ports.filter(port => port.manufacturer === "Silicon Labs");

    if (!myList.length) {
      console.log("Device not found");
    }
    else {
      pathToPort = myList[0].path;
    }
  });
}

//Create the Port and Parser, and set the on('data')
const port = new SerialPort(pathToPort);
const parser = new parsers.Readline({
  delimiter: '\r\n', //Readline Parser delimited on "carriage return newline" characters
});
parser.on('data', data => {process(data);});

/*
==============================================================================================================
--------------------------Reading-----------------------------------------------------------------------------
==============================================================================================================
*/

//Process the incoming data into the two tables
function process(data) {
  //Split the line into its component parts
  let dataSplit = data.toString().split(' '); //initial split
  if(dataSplit[0].includes("READY")) {dataSplit[0] = dataSplit[0].slice(5);} //Scrub the emitted READY message from the CAN messages
  let unixTimeStamp = dataSplit[0].slice(1, -1); //Gather the timestamp, slicing off the surrounding parentheses
  let id = dataSplit[2].slice(0, 3); //Gather the id, first three characters of the data payload
  let messageData = dataSplit[2].slice(4); //Gather the data, The rest of the data payload after the 4th character

  if(isLogging) {
    fs.writeSync(logStream, dataSplit[0] + " " + dataSplit[1] + " " + dataSplit[2] + "\n");
  }

  //Change timestamp from unixtime to hr:min:sec:ms
  let date = new Date(parseFloat(unixTimeStamp));
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();
  let milliseconds = date.getMilliseconds();
  let timeString = [hours, minutes, seconds, milliseconds].join(':');

  //Check if the ID has a label
  id = labeledIDs[id] ? labeledIDs[id] : id;

  //Gather the current count
  let messageCount = messages[id] ? messages[id]["count"] : 0;

  //Set the current message for the id whether a new id or refreshing an already seen id
  messages[id] = {"id": id, "data": messageData, "timestamp": timeString, "count": ++messageCount};

  if(!dataValues[id]) {
    dataValues[id] = [messageData];
  }
  else {
    if(dataValues[id].indexOf(messageData) == -1) {
      dataValues[id].push(messageData);
    }
  }

  //Create the table and send to the HTML page
  let messageHTML = tableify(messages);
  document.getElementById("table").innerHTML = messageHTML;
}

//handle the toggle between reading and not reading
function toggleReadBtnPressed() {
  if (!isReading){ // if we are not reading
    toggleReadBtn.innerHTML = "Pause reading"; //Toggle the button text
    document.getElementById('live-messages').hidden = false;
    startReading();
  }
  else {  //else we are reading, set the state and pauseReading
    toggleReadBtn.innerHTML = "Resume reading"; //Toggle the button text
    pauseReading();
    if (isLogging) {toggleLogBtnPressed();}  //if we are logging, stop
  }
}

//Called when the toggleReadBtn is clicked with isReading==false
function startReading() {
  isReading = true;
  isFilterable = false;

  //If test, then pipe the logFile to port
  if(mode && mode == 'test') {
    logFile.pipe(port);
  }
  port.pipe(parser);
}

//Called when the toggleReadBtn is clicked with isReading==true, make filterable and unpipe
function pauseReading() {
  isReading = false;
  isFilterable = true;
  if (isLogging) {
    toggleLogBtnPressed();
  }
  logFile.unpipe();
  port.unpipe();
}

/*
==============================================================================================================
--------------------------Logging-----------------------------------------------------------------------------
==============================================================================================================
*/

//Handle the toggle between logging and not
function toggleLogBtnPressed() {
  if (toggleLogBtn.innerHTML == "Start Logging") {
    pathToLog = document.getElementById("logfile-path").value; //Grab the entered logFile Name
    if (!pathToLog) {pathToLog = `log\\CAN_${Date.now()}.log`;} //If no logFile name was entered
    if (!pathToLog.endsWith('.log')) {pathToLog = pathToLog.concat('.log');} //If there is no file ending entered or improper, add it
    logStream = fs.openSync(pathToLog, 'a');
    isLogging = true;
    toggleLogBtn.innerHTML = "Pause Logging"; //Toggle the button text
    if (!isReading) {toggleReadBtnPressed();} //If we are not reading yet
  }
  else if (toggleLogBtn.innerHTML == "Pause Logging") {
    isLogging = false;
    toggleLogBtn.innerHTML = "Resume Logging"; //Toggle the button text
  }
  else if (toggleLogBtn.innerHTML == "Resume Logging") {
    isLogging = true;
    toggleLogBtn.innerHTML = "Pause Logging"; //Toggle the button text
    if (!isReading) {toggleReadBtnPressed();} //If we are not reading yet
  }
  else {
    alert("Oh God, what have I done?");
  }
}

// takes care of cleaning things up when the user is done logging
function endLogger() {
  fs.closeSync(logStream);
  toggleLogBtn.innerHTML = "Start Logging";
  alert("Log Saved!");
}

function endPage() {
  if(isLogging) {
    endLogger();
  }
  else if(isReading) {
    pauseReading();
  }
}

/*
==============================================================================================================
--------------------------Filtering---------------------------------------------------------------------------
==============================================================================================================
*/

//Apply the users filters
function filter() {
  if(!isFilterable) {
    pauseReading();
    isFilterable = true;
  }
  filteredMessages = {};
  let currentTime = new Date();
  let currentHours = currentTime.getHours();
  let currentMinutes = currentTime.getMinutes();
  let currentSeconds = currentTime.getSeconds();
  let currentMillis = currentTime.getMilliseconds();
  let idFilter = idFilterInput.value.toUpperCase();
  let freqFilter = Number.parseInt(frequencyInput.value);
  let toleranceFilter = Number.parseInt(toleranceInput.value);
  let timeFilter = Number.parseInt(timeInput.value);
  let dataFilter = dataInput.value;

  for (const id in messages) {
    let message = messages[id];
    let data = dataValues[id];
    let date = message.timestamp.split(":");
    let count = message.count;
    let timeDifference = (currentHours - date[0]) * 3600 + (currentMinutes - date[1]) * 60 + (currentSeconds - date[2]) + (currentMillis - date[3]) / 100;

    if(and) {
      if(!idFilter || idFilter == id) {
        if(!freqFilter) {
          if(!dataFilter || data.indexOf(dataFilter) != -1) {
            if(!timeFilter || timeDifference < timeFilter) {
              filteredMessages[id] = message;
            }
          }
        }
        else if(!toleranceFilter && freqFilter == count){
          if(!dataFilter || data.indexOf(dataFilter) != -1) {
            if(!timeFilter || timeDifference < timeFilter) {
              filteredMessages[id] = message;
            }
          }
        }
        else if(count <= freqFilter + toleranceFilter &&  count >= freqFilter - toleranceFilter) {
          if(!dataFilter || data.indexOf(dataFilter) != -1) {
            if(!timeFilter || timeDifference < timeFilter) {
              filteredMessages[id] = message;
            }
          }
        }
      }
    } 
    else {
      if ((idFilter && idFilter == id) || (freqFilter && (freqFilter == count || (toleranceFilter && count < freqFilter + toleranceFilter && count > freqFilter - toleranceFilter)) || (timeFilter && timeDifference < timeFilter) || (dataFilter && data.indexOf(dataFilter) != -1))) {
        filteredMessages[id] = message;
      }
    }
    let messageHTML = tableify(filteredMessages);
    document.getElementById("table").innerHTML = messageHTML;
  }
}

//Set the table to be all data
function clearFilter() {
  filteredMessages = {};
  let messageHTML = tableify(messages);
  document.getElementById("table").innerHTML = messageHTML;
}

function orClick() {
  and = false;
}

function andClick() {
  and = true;
}

/*
==============================================================================================================
--------------------------labeling----------------------------------------------------------------------------
==============================================================================================================
*/

//Retrieve the currently stored vehicles
function retrieveVehicles() {
  vehiclesJSON = JSON.parse(fs.readFileSync("vehicles.json"));
  populateDropDown();
  selectedVehicle = vehicleDropDown.options[vehicleDropDown.selectedIndex].value;
  labeledIDs = vehiclesJSON[selectedVehicle].labeled_ids;
  for(const id in labeledIDs) {
    ids.push(id);
    labels.push(labeledIDs[id].toUpperCase());
  }
  //Create the table and send to the HTML page
  let messageHTML = tableify(labeledIDs);
  document.getElementById("tableID").innerHTML = messageHTML;
}

//Populate the vehicles drop down with currently stored vehicles
function populateDropDown() {
 let vehicleNames = Object.keys(vehiclesJSON);
 vehicleNames.forEach(name => {vehicleDropDown.options.add(new Option(name));});
}

//handles the vehicle drop down selection changing
function vehicleSelectionChanged(event) {
  selectedVehicle = event.target.value;
  labeledIDs = vehiclesJSON[selectedVehicle].labeled_ids;
  ids = [];
  labels = [];
  for(const id in labeledIDs) {
    ids.push(id);
    labels.push(labeledIDs[id].toUpperCase());
  }
  //Create the table and send to the HTML page
  let messageHTML = tableify(labeledIDs);
  document.getElementById("tableID").innerHTML = messageHTML;
  if (Object.keys(labeledIDs)[0].length == 0) {
    document.getElementById('knownIdsTable').hidden = true;  
  } else {
    document.getElementById('knownIdsTable').hidden = false;
  }
}

//Add a label
function addLabel() {
  console.log(labels);
  let id = idInput.value.toUpperCase();
  let label = labelInput.value;
  if(labels.indexOf(label.toUpperCase()) != -1) {
    alert("An ID already has that label");
    return;
  }
  else if (ids.indexOf(id) != -1) {
    alert("ID is already labelled");
    return;
  }
  labels.push(label.toUpperCase());
  vehiclesJSON[selectedVehicle]["labeled_ids"][id] = label;
  fs.writeFileSync("vehicles.json", JSON.stringify(vehiclesJSON));
  labeledIDs = vehiclesJSON[selectedVehicle].labeled_ids;
  if (Object.keys(messages).length !== 0) {
    messages[label] = {"id": label, "data": messages[id].data, "timestamp": messages[id].timestamp, "count": messages[id].count};
  }
  delete messages[id];
  dataValues[label] = dataValues[id];
  delete dataValues[id];
  labeledIDs = vehiclesJSON[selectedVehicle].labeled_ids;
  //Create the table and send to the HTML page
  let messageHTML = tableify(messages);
  document.getElementById("table").innerHTML = messageHTML;
  //Create the table and send to the HTML page
  let messageHTMLID = tableify(labeledIDs);
  document.getElementById("tableID").innerHTML = messageHTMLID;
}

//handles the removal of a label from an ID
function removeLabel() {
  let label = labelInput.value; //The label to remove
  if(labels.indexOf(label.toUpperCase()) == -1) { //Check to make sure the label has been given to an ID previously
    alert("This label does not exist");
    return;
  }
  labels = labels.filter((string) => {return string != label.toUpperCase();}); //Filter out the label from the labels array
  for (const id in labeledIDs) { //For each id in labeledIDs
    if(labeledIDs[id].toUpperCase() == label.toUpperCase()) { //If label of labeledIDs[id] matches the search label
      delete labeledIDs[id]; //delete the label from the labeledIDs at that id
      delete vehiclesJSON[selectedVehicle]["labeled_ids"][id]; //delete the label from the JSON file
    }
  }
  //Write the change to the JSON file
  fs.writeFileSync("vehicles.json", JSON.stringify(vehiclesJSON));
  //Update the labelled ids table
  let messageHTMLID = tableify(labeledIDs);
  document.getElementById("tableID").innerHTML = messageHTMLID;
}

//Add the vehicle to the JSON file
function addVehicle(name) {
  vehicleDropDown.options.add(new Option(name));
  vehicleDropDown.options[vehicleDropDown.options.length - 1].selected = true;
  selectedVehicle = name;
  vehiclesJSON[name] = {
      "received_ids": [],
      "labeled_ids": {},
      "notes": ""
  };
  fs.writeFileSync("vehicles.json", JSON.stringify(vehiclesJSON));
}

document.getElementById('remove-vehicle-btn').addEventListener('click', removeVehicleProfile);

function removeVehicleProfile() {
  if (selectedVehicle !== "None") {
    // remove the vehicle from vehicles.json
    delete vehiclesJSON[selectedVehicle];
    let newJSONtext = JSON.stringify(vehiclesJSON);
    let fd = fs.openSync('vehicles.json', 'w');
    fs.writeSync(fd, Buffer.from(newJSONtext));
    fs.closeSync(fd);

    // update the dropdown to remove the new vehicle
    vehicleDropDown.remove(vehicleDropDown.selectedIndex);
    // make the "None" the selected vehicle
    vehicleDropDown.options[0].selected = true;
    selectedVehicle = "None";
    document.getElementById("tableID").innerHTML = "";
  }
}

//Open the Modal
function showModal() {
  modal.style.display = "block";
}

//Close the modal and enter the new vehicle
function hideModal() {
  if (vehicleNameIn.value) {
    addVehicle(vehicleNameIn.value);
  }
  vehicleNameIn.value = '';
  modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}
