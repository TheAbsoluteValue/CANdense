const Readline = require('@serialport/parser-readline');
const fs = require('fs');

// the point at which we will append a row for each message
const messageTBody = document.getElementById("message-table-body");

let os = getOS(); // string name of the OS which is used for file loading
let fileOptions; // list of the files the user can read in
let selectedPath; // the path to the log file the user wants
let vehiclesJSON; // vehicles.json parsed as an object
let vehicleDropdown; // dropdown user can select vehicle profile from
// TODO: add this as first option in vehicle dropdown
let selectedVehicle = "None"; // name of the vehicle the user has selected
let labeledIDs = {}; // object holding labeled IDs
const idCounts = {}; // the count of each message (used in count table)


// don't do anything until all DOM element load
document.addEventListener('DOMContentLoaded', () => {
  populateVehicleProfileDropdown(); // load in vehicle profiles for selection
  populateSelectFileDropdown(); // load list of log file names for selection

  // needs to be declared in this event because it accesses DOM elements
  function addVehicleProfile() {
    {
      // create the DOM objects for adding
      let newVehicleInput = document.createElement("input");
      newVehicleInput.setAttribute("id", "new-vehicle-input");
      let newVehicleBtn = document.createElement("button");
      newVehicleBtn.innerHTML = "Save vehicle";
      newVehicleBtn.setAttribute("id", "new-vehicle-btn");

      // add the new object to the DOM
      addVehicleBtn.insertAdjacentElement('afterend', newVehicleInput);
      newVehicleInput.insertAdjacentElement('afterend', newVehicleBtn);

      // adds the new vehicle to vehicles.json
      newVehicleBtn.addEventListener('click', function() {
        let vehicleName = newVehicleInput.value;
        if (vehicleName) { // add the vehicle to JSON object
          vehiclesJSON[vehicleName] = {
            vehicleName: {
              "received_ids": [],
              "labeled_ids": {},
              "notes": ""
            }
          };

          // write the vehicle to vehicles.json
          let newJSONtext = JSON.stringify(vehiclesJSON);
          let fd = fs.openSync('vehicles.json', 'w');
          fs.writeSync(fd, Buffer.from(newJSONtext));
          fs.closeSync(fd);

          // update the dropdown to include the new vehicle
          populateVehicleProfileDropdown();
          // make the newly added vehicle the selected one
          vehicleDropdown.options[vehicleDropdown.options.length - 1].selected = true;

          // remove button to save the vehicle and the name input
          newVehicleInput.parentNode.removeChild(newVehicleInput);
          newVehicleBtn.parentNode.removeChild(newVehicleBtn);
        } else { // user tried to add '' to the list
          alert("Can not store empty vehicle name");
        }
      });
    }
  }

  // sets the currently selected path to the file that the user sees
  selectedPath = document.getElementById('logfile-path-dropdown').options[0].value;

  // read the log file, as long as the user has selected a path
  document.getElementById('read-btn').addEventListener('click', () => {
    if (!selectedPath) {
      alert("Please enter a file path");
    } else {
      readLogFile(selectedPath);
    }
  });

  /*
  Allows user to add a vehicle to the list of vehicles. Also adds that vehicle to the
  vehicles.config JSON file.
  */
  let addVehicleBtn = document.getElementById('add-vehicle-btn');
  addVehicleBtn.addEventListener('click', addVehicleProfile);

  // add a label to IDs
  let idInput = document.getElementById('id-input');
  let labelInput = document.getElementById('label-input');
  document.getElementById('add-label-btn').addEventListener('click', () => {
    if (selectedVehicle !== "None" && selectedVehicle) {
      let id = idInput.value; // string
      let label = labelInput.value;
      if (!id || !label) {
        alert('Must enter ID and label');
        return; // error; nothing more should happen
      }
      // add the label to vehicles.json
      let labeledIdObject = vehiclesJSON[selectedVehicle].labeled_ids;
      if (labeledIdObject == undefined) {
        vehiclesJSON[selectedVehicle].labeled_ids = {
          id: label
        };
      } else {
        vehiclesJSON[selectedVehicle].labeled_ids[id] = label;
      }
      let jsonString = JSON.stringify(vehiclesJSON);
      console.log(jsonString);
      let fd = fs.openSync('vehicles.json', 'w');
      fs.writeSync(fd, jsonString);

      // update the count and message tables to reflect the new labels
      updateMessageTable(id, label);
      updateCountTable(id, label);
    } else {
      alert("Please select a vehicle to add ID label to");
    }
  });

  // when a label is updated, show this change in the message table
  function updateMessageTable(updateID, newLabel) {
    let rowArray = Array.from(messageTBody.getElementsByClassName(updateID));
    rowArray.forEach(tableRow => {
      tableRow.innerHTML = newLabel;
    });
  }

  // when a label is updated, change massage counts table
  const occurenceTableBody = document.getElementById('count-table-body');

  function updateCountTable(updateID, newLabel) {
    let updateRow = document.getElementById(updateID.toString());
    updateRow.firstChild.innerHTML = newLabel;
  }
});

// creates the table to show user how many times messages of each ID occurred
function createCountTable(idCounts) {
  {
    let labeledIDs = vehiclesJSON[selectedVehicle].labeled_ids;
    let countTableBody = document.getElementById('count-table-body');
    // array version of the object that has ID: count
    let idCountEntries = sortCountArray(Object.entries(idCounts));
    idCountEntries.forEach(item => {
      let newRow = document.createElement("tr");
      let id = item[0];
      newRow.setAttribute("id", id); // ID is used to add label

      // check whether labels exist for the given vehicle
      let labelsExist = vehiclesJSON[selectedVehicle].labeled_ids != undefined;
      if (selectedVehicle !== "None" && labelsExist && vehiclesJSON[selectedVehicle].labeled_ids[id]) {
        // replace the id in the table with the label
        id = vehiclesJSON[selectedVehicle].labeled_ids[id];
      }

      // just creating the HTML elements
      let idTd = document.createElement("td"); // holds the ID or label
      idTd.className = "string";
      idTd.textContent = id;
      let countTd = document.createElement("td");
      countTd.className = "string";
      countTd.textContent = item[1];
      // and appending them to the table
      newRow.appendChild(idTd);
      newRow.appendChild(countTd);
      countTableBody.appendChild(newRow);
    });
  }
}

// creates the table to show ALL received messages
function createMessageTable(data) {
  // split data in to ID, message data, and time step
  let dataSplit = data.toString().split(' ');
  // get the ID and message data
  const idData = dataSplit[2].split('#');
  let id = idData[0];
  let content = idData[1];

  // make the time stamp human-readable
  let unixTimeStamp = dataSplit[0].slice(1, -1);
  let date = new Date(parseFloat(unixTimeStamp));
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();
  let milliseconds = date.getMilliseconds();
  let arr = [hours, minutes, seconds, milliseconds];
  let timeString = [hours, minutes, seconds, milliseconds].join(':');

  // count number of occurrences of each ID (for later use by the count table)
  if (idCounts[id] == 0 || idCounts[id]) {
    idCounts[id]++;
  } else { // haven't encountered ID yet
    idCounts[id] = 0;
  }

  // add message to the table (doesn't show until ALL messages are added)
  let newRow = document.createElement('tr');
  let idTd = document.createElement('td');
  idTd.className = `string ${id}`;
  // replace the ID with the label if one exists
  let labelsExist = vehiclesJSON[selectedVehicle].labeled_ids != undefined;
  if (selectedVehicle !== "None" && labelsExist && vehiclesJSON[selectedVehicle].labeled_ids[id]) {
    id = vehiclesJSON[selectedVehicle].labeled_ids[id];
  }
  idTd.textContent = id;
  let contentTd = document.createElement('td');
  contentTd.className = "string";
  contentTd.textContent = content;
  let timeTd = document.createElement('td');
  timeTd.className = "string";
  timeTd.textContent = timeString;

  newRow.appendChild(idTd);
  newRow.appendChild(contentTd);
  newRow.appendChild(timeTd);
  messageTBody.appendChild(newRow);
}

// reads the log file containing all messages
function readLogFile(path) {
  const logFileStream = fs.createReadStream(path);
  // parser will emit data any time a newline occurs
  const parser = logFileStream.pipe(new Readline());

  // build the table that shows the count of each message
  logFileStream.on('end', () => {
    createCountTable(idCounts)
  });

  // build the table that shows ALL messages
  parser.on('data', data => {
    createMessageTable(data)
  });

  // once table is done bulding, show it
  document.getElementById('message-table-container').hidden = false;
}

// puts list of log files the user can display in the drop down
function populateSelectFileDropdown() {
  // get select ID, for file selection in current directory
  let filePathSelector = document.getElementById('logfile-path-dropdown');
  // populate var with current files in directory based on OS
  if (os === "Windows") {
    fileOptions = fs.readdirSync('./');
  } else {
    fileOptions = fs.readdirSync(process.cwd());
  }
  // filter above to only include log files
  var logFiles = fileOptions.filter(file => file.endsWith('.log'));
  // populate select options
  logFiles.forEach(option => filePathSelector.options.add(new Option(option)));
}

// retrieves the stored vehicle names and adds them to this list
function populateVehicleProfileDropdown() {
  // get select ID, for file selection in current directory
  vehicleDropdown = document.getElementById('vehicle-profile-name');
  let selected = vehicleDropdown.selectedIndex;
  if (selected == -1) {
    selected = 0
  };
  // populate var with current files in directory based on OS
  if (os === "Windows") {
    try { // using 'r+' flag will throw exception when file doesn't exist
      // r+ flag means reading/writing
      vehiclesJSON = JSON.parse(fs.readFileSync('./vehicles.json', 'r+'));
    } catch (e) { // file doesn't exist, so create it (and add "None" vehicle option)
      // a+ open the file for reading/appending, creates file if does not exist
      let newFile = fs.openSync('./vehicles.json', 'a+');
      vehiclesJSON = {
        "None": {
          "received_ids": [],
          "labeled_ids": {},
          "notes": ""
        }
      };
      fs.writeSync(newFile, JSON.stringify(vehiclesJSON));
      fs.closeSync(newFile);
    }
  } else { // MacOS/Linux
    // all comments from the os === "Windows" case apply here
    try {
      vehiclesJSON = JSON.parse(fs.readFileSync(process.cwd() + '/vehicles.json'));
    } catch (e) {
      let newFile = fs.openSync(process.cwd() + '/vehicles.json', 'a+');
      vehiclesJSON = {
        "None": {
          "received_ids": [],
          "labeled_ids": {},
          "notes": ""
        }
      };
      fs.writeSync(newFile, JSON.stringify(vehiclesJSON));
      fs.closeSync(newFile);
    }
  }

  /*
  clear the list of options so that when adding a new vehicle,
  the old ones don't appear multiple times. This is useful when this
  method is called from vehicleSelectionChanged. Elements need to be
  removed in reverse order
  https://stackoverflow.com/questions 3364493/how-do-i-clear-all-options-in-a-dropdown-box
  */
  for (i = vehicleDropdown.options.length - 1; i >= 0; i--) {
    vehicleDropdown.options.remove(i);
  }
  // keys of vehiclesJSON is the name of the vehicle
  let vehicleNames = Object.keys(vehiclesJSON);
  // populate select options
  vehicleNames.forEach(name => vehicleDropdown.options.add(new Option(name)));
  // reselect the selected element since everything was previous removed
  vehicleDropdown.selectedIndex = selected;
}

// on file change, return a string of the correct path depending on OS
function logFileSelectionChanged(event) {
  if (os === "Windows") {
    selectedPath = './' + event.target.value;
  } else {
    selectedPath = event.target.value;
  }
}

// needed this for sorting array of message occurences by ID
function sortCountArray(arr) {
  return arr.sort((a, b) => (a[0] > b[0]) ? 1 : -1);
}

// When the user selects a new vehicle, this event fires
function vehicleSelectionChanged(event) {
  selectedVehicle = event.target.value;
  populateVehicleProfileDropdown();
}

// use navigator to figure out which OS you are on, useful for file directory stuff
function getOS() {
  if (navigator.appVersion.indexOf("Win") != -1) {
    return "Windows";
  } else if (navigator.appVersion.indexOf("Mac") != -1) {
    return "MacOS"
  } else {
    return "Linux";
  }
}
