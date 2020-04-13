const Readline = require('@serialport/parser-readline');
const fs = require('fs');
const tableify = require('tableify'); //For HTML Tables

// the point at which we will append a row for each message
const messageTableBody = document.getElementById("message-table-body");
let countTableBody; // will be created after all messages are read

let os = getOS(); // string name of the OS which is used for file loading
let fileOptions; // list of the files the user can read in
let selectedPath; // the path to the log file the user wants
let vehiclesJSON; // vehicles.json parsed as an object
let modal; // modal that allow user to enter vehicle name
let newVehicleInput; // text box to enter vehicle name within modal
let addVehicleBtn; // button for opening the modal to add vehicle
let removeVehicleBtn; // button for removing a vehicle profile
let vehicleDropdown; // dropdown user can select vehicle profile from
let selectedVehicle = "None"; // name of the vehicle the user has selected
let labeledIDs = {}; // object holding labeled IDs
let labelsExist = false; // whether there are labels for the selected vehicle
const idCounts = {}; // the count of each message (used in count table)
let tablesDrawn = false; // whether both tables are drawn
// to filter the count table's rows by various parameters
const countTableFilters = {
  by_id: [],
  by_msg_freq: []
}
// to filter the table with all messages by various parameters
const msgTableFilters = {
  by_id: [],
  by_data_value: []
}
const countTableHiddenRows = [] // list of rows of the count table hidden by filter; makes unhdiding easy
const msgTableHiddenRows = [] // list of rows of all message table hidden by filter;
// makes unhiding easier
let countIdFilter; // for the count table
let freqFilter; // for the count table
let freqTolerance; // for the count table
let msgIdFilter; // for the table with all messages
let dataValFilter; // for the table with all messages

// don't do anything until all DOM element loadread-btn
document.addEventListener('DOMContentLoaded', () => {
  populateVehicleProfileDropdown(); // load in vehicle profiles for selection
  populateSelectFileDropdown(); // load list of log file names for selection
  modal = document.getElementById("myModal");

  /*
  Allows user to add a vehicle to the list of vehicles. Also adds that vehicle to the
  vehicles.config JSON file.
  */
  addVehicleBtn = document.getElementById('add-vehicle-btn');
  addVehicleBtn.addEventListener('click', () => {
    showModal();
  });

  // needs to be declared in this event because it accesses DOM elements
  function addVehicleProfile() {
    newVehicleInput = document.getElementById('new-vehicle-input');
    let vehicleName = newVehicleInput.value;
    if (vehicleName) { // add the vehicle to JSON object
      vehiclesJSON[vehicleName] = {
        "received_ids": [],
        "labeled_ids": {},
        "notes": ""
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
      selectedVehicle = vehicleName;
    }
  }

  function removeVehicleProfile() {
    if (selectedVehicle !== "None") {
      // remove the vehicle from vehicles.json
      delete vehiclesJSON[selectedVehicle];
      let newJSONtext = JSON.stringify(vehiclesJSON);
      let fd = fs.openSync('vehicles.json', 'w');
      fs.writeSync(fd, Buffer.from(newJSONtext));
      fs.closeSync(fd);

      // update the dropdown to remove the new vehicle
      vehicleDropdown.remove(vehicleDropdown.selectedIndex);
      // make the "None" the selected vehicle
      vehicleDropdown.options[0].selected = true;
      selectedVehicle = "None";

      clearIdLabels();
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

  document.getElementById('clear-everything-btn').addEventListener('click', clearAllTables);

  removeVehicleBtn = document.getElementById('remove-vehicle-btn');
  removeVehicleBtn.addEventListener('click', () => {
    removeVehicleProfile();
  });

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
        vehiclesJSON[selectedVehicle].labeled_ids = {};
        vehiclesJSON[selectedVehicle].labeled_ids[id] = label;
      } else {
        vehiclesJSON[selectedVehicle].labeled_ids[id] = label;
      }
      let jsonString = JSON.stringify(vehiclesJSON);
      let fd = fs.openSync('vehicles.json', 'w');
      fs.writeSync(fd, jsonString);

      // show the labeled ID table
      let messageHTML = tableify(labeledIdObject);
      document.getElementById("tableID").innerHTML = messageHTML;
      document.getElementById('knownIdsTable').hidden = false;

      // update the count and message tables to reflect the new labels, if tables have been created
      if (tablesDrawn) {
        updateMessageTable(id, label);
        updateCountTable(id, label);
      }
    } else {
      alert("Please select a vehicle to add ID label to");
    }
  });

  // for count table
  document.getElementById('table-count-apply-filter-btn').addEventListener('click', () => {
    updateCountTableFilters();
    filterCountTable();
  });

  // for count table
  document.getElementById('table-count-clear-filter-btn').addEventListener('click', () => {
    clearCountTableFilters();
  });

  // for table with all messages
  document.getElementById('table-all-apply-filter-btn').addEventListener('click', () => {
    updateMessageTableFilters();
    filterMsgTable();
  });

  // for table with all messages
  document.getElementById('table-all-clear-filter-btn').addEventListener('click', () => {
    clearMsgTableFilters();
  });

  // Open the Modal
  function showModal() {
    modal.style.display = "block";
  }

  document.getElementById('close-modal-btn').addEventListener('click', hideModal);

  // Close the modal and enter the new vehicle
  function hideModal() {
    addVehicleProfile();
    newVehicleInput.value = '';
    modal.style.display = "none";
  }

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }
});

// creates the table to show user how many times messages of each ID occurred
function createCountTable(idCounts) {
  {
    labeledIDs = vehiclesJSON[selectedVehicle].labeled_ids;
    countTableBody = document.getElementById('count-table-body');
    // array version of the object that has ID: count
    let idCountEntries = sortCountArray(Object.entries(idCounts));
    idCountEntries.unshift(["id", "count"]);
    idCountEntries.forEach(item => {
      let newRow = document.createElement("tr");
      let id = item[0];

      // just creating the HTML elements
      let idTd = document.createElement("td"); // holds the ID or label
      idTd.className = "string";
      idTd.setAttribute("id", id);
      // check whether labels exist for the given vehicle
      labelsExist = vehiclesJSON[selectedVehicle].labeled_ids != undefined;
      if (selectedVehicle !== "None" && labelsExist && vehiclesJSON[selectedVehicle].labeled_ids[id]) {
        // replace the id in the table with the label
        id = vehiclesJSON[selectedVehicle].labeled_ids[id];
      }
      idTd.textContent = id;
      let countTd = document.createElement("td");

      countTd.className = "string";
      countTd.textContent = item[1];

      // add css to some elements
      countTd.classList.add("id-td");
      idTd.classList.add("id-td");
      newRow.classList.add("id-tr");

      // and appending them to the table
      newRow.appendChild(idTd);
      newRow.appendChild(countTd);
      countTableBody.appendChild(newRow);
    });

    // this is the last table that needs to be made, so...
    tablesDrawn = true;
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
  labelsExist = vehiclesJSON[selectedVehicle].labeled_ids != undefined;
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

  // set additional css classes
  messageTableBody.id = "msg-table";
  idTd.classList.add("msg-td");
  contentTd.classList.add("msg-td");
  timeTd.classList.add("msg-td");

  newRow.appendChild(idTd);
  newRow.appendChild(contentTd);
  newRow.appendChild(timeTd);
  messageTableBody.appendChild(newRow);
}

// reads the log file containing all messages
function readLogFile(path) {
  const logFileStream = fs.createReadStream(path);
  // parser will emit data any time a newline occurs
  const parser = logFileStream.pipe(new Readline());

  // build the table that shows the count of each message
  logFileStream.on('end', () => {
    document.getElementById("counting-msg").hidden = true;
    document.getElementById("count-thead").hidden = false;
    createCountTable(idCounts);
  });

  // build the table that shows ALL messages
  parser.on('data', data => {
    createMessageTable(data);
  });

  clearAllTables();

  // unhide the container for the tables;
  document.getElementById('CanMessageTables').hidden = false;
  document.getElementById("counting-msg").hidden = false;
  document.getElementById("count-thead").hidden = true;


  // once table with all messages is done bulding, show it
  document.getElementById('message-table-container').hidden = false;
}

// clears both tables; used when reading in a new file
function clearAllTables() {
  if (tablesDrawn) {
    clearMsgTableFilters();
    clearCountTableFilters();
    document.getElementById('CanMessageTables').hidden = true;
    messageTableBody.innerHTML = "";
    countTableBody.innerHTML = "";
    tablesDrawn = false;
  }
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
  let vehicleFilePath; // different on Unix/Windows
  if (os === "Windows") {
    vehicleFilePath = './vehicles.json';
  } else {
    vehicleFilePath = process.cwd() + '/vehicles.json';
  }
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
  selectedVehicle = vehicleDropdown[selected].value;
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
  clearIdLabels(); // different vehicle, labels are different
  selectedVehicle = event.target.value;
  labeledIDs = vehiclesJSON[selectedVehicle].labeled_ids;

  if (!isEmpty(labeledIDs)) {
    document.getElementById('knownIdsTable').hidden = false;
  } else {
    document.getElementById('knownIdsTable').hidden = true;
  }

  // Create the table and send to the HTML page
  let messageHTML = tableify(labeledIDs);
  document.getElementById("tableID").innerHTML = messageHTML;

  if (tablesDrawn) {
    massTableUpdate();
  }
  populateVehicleProfileDropdown();
}

// check if labelled id's json is empty
function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

// clears the labels from both tables without recreating the whole table
function clearIdLabels() {
  document.getElementById('knownIdsTable').hidden = true;
  document.getElementById("tableID").innerHTML = '';

  // we know all IDs that have been changed, so just reset the innerHTML of each row
  if (tablesDrawn) {
    Object.keys(labeledIDs).forEach(id => {
      console.log(id);
      document.getElementById(id).innerHTML = id;
      Array.from(document.getElementsByClassName(id)).forEach(rowId => {
        rowId.innerHTML = id;
      });
    });
  }
  labelsExist = false;
  labeledIDs = {};
}

// adds a label to the row with the count of the given ID
// only changes for a single id, massTableUpdate handles for ALL labeled IDs
function updateCountTable(updateID, newLabel) {
  let updateTd = document.getElementById(updateID.toString());
  updateTd.innerHTML = newLabel;
}

// adds a label for each row in the table with the given ID
// only changes for a single id, massTableUpdate handles for ALL labeled IDs
function updateMessageTable(updateID, newLabel) {
  let rowArray = Array.from(messageTableBody.getElementsByClassName(updateID));
  rowArray.forEach(tableRowId => {
    tableRowId.innerHTML = newLabel;
  });
}

// used when changing vehicles; updates both tables with the new vehicle's labels
function massTableUpdate() {
  Object.entries(labeledIDs).forEach(entry => {
    updateCountTable(entry[0], entry[1]);
    updateMessageTable(entry[0], entry[1]);
  });
}

/* Filters */
function updateCountTableFilters() {
  idFilter = document.getElementById('table-count-id-filter');
  msgFreqFilter = document.getElementById('table-count-freq-filter');
  msgFreqTolerance = document.getElementById('table-count-freq-tolerance');

  // don't want previous filters to persist
  clearCountTableFilters();

  if (idFilter.value) {
    // split on space, or comma, or both
    countTableFilters.by_id = idFilter.value.split(/[\s|,]+/);
  }

  if (msgFreqFilter.value) {
    let frequencies = msgFreqFilter.value.split(/[\s|,]+/).map(Number);
    countTableFilters.by_msg_freq = frequencies;
  }
}

function updateMessageTableFilters() {
  idFilter = document.getElementById('table-all-id-filter');
  dataValFilter = document.getElementById('table-all-data-val-filter');

  // don't want previous filters to persist
  clearMsgTableFilters();

  if (idFilter.value) {
    // split on space, or comma, or both
    msgTableFilters.by_id = idFilter.value.split(/[\s|,]+/);
  }

  if (dataValFilter.value) {
    msgTableFilters.by_data_value = dataValFilter.value.split(/[\s|,]+/);
  }
}

function filterCountTable() {
  let operator = document.querySelector('input[name="table-count-filter-operator"]:checked').value;
  let defaultTruthy; // used in the conditions where the filter doesn't exist
  if (operator === "OR") {
    operator = logicalOr;
    defaultTruthy = false;
  } else {
    operator = logicalAnd;
    defaultTruthy = true;
  }
  // Array is more easily iterated through than HTMLcollection
  let rowArray = Array.from(countTableBody.children);
  const idFilterExists = countTableFilters.by_id.length > 0;
  const frequencyFilterExists = countTableFilters.by_msg_freq.length > 0;
  const frequencyToleranceExists = Boolean(msgFreqTolerance.value);
  let frequencyValues = countTableFilters.by_msg_freq;
  if (frequencyToleranceExists) {
    frequencyValues = generateRanges(frequencyValues, Number(msgFreqTolerance.value));
  }

  /* Filters messages for the table that just displays the occurrence count of each message.
  The rows are filtered by ID (or its label) and by message count. The data field and time stamp
  filters do not apply to the data present in this table.
  */
  rowArray.forEach(row => {
    /* Table rows are hidden if they do not satisfy ALL filter constraints the user has added.
    For each type of filter, we need to check if the user has even entered any values for that
    filter type. If the user has not entered a filter in that category, the ternary operator just
    evaluates to true because we do not want it to have an effect on whether the row is hidden.
    If the user has entered an ID filter (either by the hex ID or its label), we check if the row
    is for the ID that we want to see. If it is not, the row will be hiddem; if it is, whether the
    row is hidden depends on whether the message can pass the frequency filter.
    If the user has entered a frequency (count) filter, then we check to see if the row indicates
    the proper number of occurrences. Obviously, if it doesn't the row is hidden.
    */
    if (!operator(
        (idFilterExists ? countTableFilters.by_id.includes(row.firstChild.textContent) : defaultTruthy),
        (frequencyFilterExists ? frequencyValues.includes(Number(row.children[1].innerHTML)) : defaultTruthy))) {
      row.hidden = true;
      countTableHiddenRows.push(row);
    }
  });
}

function filterMsgTable() {
  let operator = document.querySelector('input[name="table-all-filter-operator"]:checked').value;
  let defaultTruthy; // used in the conditions where the filter doesn't exist
  if (operator === "OR") {
    operator = logicalOr;
    defaultTruthy = false;
  } else {
    operator = logicalAnd;
    defaultTruthy = true;
  }
  let rowArray = Array.from(messageTableBody.children);
  // used in determining whether to hide a row
  const idFilterExists = msgTableFilters.by_id.length > 0;
  const dataFilterExists = msgTableFilters.by_data_value.length > 0;

  /* Filters messages for the table that displays ALL messages. In this table, messages will be
  filtered by ID (or its label), data field value, and time step. The count filter is not applicable
  to this table since it does not display message counts (that is what the other table is for).
  */
  rowArray.forEach(row => {
    if (!operator(
        (idFilterExists ? msgTableFilters.by_id.includes(row.firstChild.textContent) ||
          msgTableFilters.by_id.includes(row.firstChild.classList[1].textContent) : defaultTruthy),
        (dataFilterExists ? msgTableFilters.by_data_value.includes(row.children[1].textContent) : defaultTruthy))) {
      row.hidden = true;
      msgTableHiddenRows.push(row);
    }
  });
}

function clearCountTableFilters() {
  countTableHiddenRows.forEach(row => {
    row.hidden = false;
  });

  // setting length == 0 clears the list
  countTableHiddenRows.length = 0;
  countTableFilters.by_id.length = 0;
  countTableFilters.by_msg_freq.length = 0;
}

function clearMsgTableFilters() {
  msgTableHiddenRows.forEach(row => {
    row.hidden = false;
  });

  // setting length == 0 clears the list
  msgTableHiddenRows.length = 0;
  msgTableFilters.by_id.length = 0;
  msgTableFilters.by_data_value.length = 0;
}

/* Given a list of integers, returns a new list that contains all the original numbers as well as
those numbers ± the specificed deviation amount.
E.g. generateRanges([5, 13], 2)) ==> [3,4,5,6,7,11,12,13,14,15]
Used when a tolerance is specified in the message frequency filter
*/
function generateRanges(list, deviation) {
  let r = [];
  list.forEach(num => {
    var startVal = num - deviation >= 0 ? num - deviation : 0; // prevent from generating neg. num
    var endVal = num + deviation;
    for (i = startVal; i <= endVal; i++) {
      if (!r.includes(i)) {
        r.push(i);
      }
    }
  });

  return r;
}

// used for filtering logic
function logicalAnd(condition1, condition2) {
  return condition1 && condition2
}

function logicalOr(condition1, condition2) {
  return condition1 || condition2;
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
