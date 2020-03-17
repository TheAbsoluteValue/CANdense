const Readline = require('@serialport/parser-readline');
const fs = require('fs');

// the point at which we will append a row for each message
const messageTBody = document.getElementById("message-table-body");

let os = getOS();  // string name of the OS which is used for file loading
let fileOptions;  // list of the files the user can read in
let selectedPath;  // the path to the log file the user wants
let vehiclesJSON;  // vehicles.json parsed as an object
let vehicleDropdown; // dropdown user can select vehicle profile from
// TODO: add this as first option in vehicle dropdown
let selectedVehicle = "None";  // name of the vehicle the user has selected
let labeledIDs = {};  // object holding labeled IDs


// don't do anything until all DOM element load
document.addEventListener('DOMContentLoaded', () => {
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

	function readLogFile(path) {
		let logFileStream = fs.createReadStream(path);
		// parser will emit data any time a newline occurs
		const parser = logFileStream.pipe(new Readline());
		// ID: count
		const idCounts = {};
		labeledIDs = vehiclesJSON[selectedVehicle].labeled_ids;
		// TODO: write this to the vehicles.json file

		// when are done reading (and therefore counting), we can create the table that counts the variable
		logFileStream.on('end', () => {
			let occurrenceTableBody = document.getElementById('occurrence-table-body');
			// array version of the object that has ID: count
			let idCountEntries = sortOccurrencesArray(Object.entries(idCounts));
			idCountEntries.forEach(item => {
				let newRow = document.createElement("tr");
				// this allows this ID's label to be changed from updateCountTable
				let id = item[0];
				newRow.setAttribute("id", id);
				let idTd = document.createElement("td");
				idTd.className = "string";
				idTd.textContent = item[0];
				let countTd = document.createElement("td");
				countTd.className = "string";
				countTd.textContent = item[1];

				newRow.appendChild(idTd);
				newRow.appendChild(countTd);
				occurrenceTableBody.appendChild(newRow);
			});
		});

		// this handles reading the file and constructing the necessary data structures
		// tables aren't shown until ALL data has been read in
		parser.on('data', data => {
			let dataSplit = data.toString().split(' ');
			if (dataSplit[2]) {
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

				// count number of occurrences of each ID
				if (idCounts[id] == 0 || idCounts[id]) {
					idCounts[id]++;
				} else { // haven't encountered ID yet
					idCounts[id] = 0;
				}

				// add message to the table (doesn't show until ALL messages are added)
				let newRow = document.createElement('tr');
				let idTd = document.createElement('td');
				idTd.className = `string ${id}`;
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
		});

		// once table is done bulding, show it
		document.getElementById('message-table-container').hidden = false;
	}
});

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

// on file change, return a string of the correct path depending on OS
function logFileSelectionChanged(event) {
	if (os === "Windows") {
		selectedPath = './' + event.target.value;
	} else {
		selectedPath = event.target.value;
	}
}

// needed this for sorting array of message occurences per ID
function sortOccurrencesArray(arr) {
    return arr.sort((a, b) => (a[0] > b[0]) ? 1 : -1);
}

/* Vehicle Profile Selection */

// When the user selects a new vehicle, this event fires
function vehicleSelectionChanged(event) {
  selectedVehicle = event.target.value;
	populateVehicleProfileDropdown();

}

// retrieves the stored vehicle names and adds them to this list
// TODO: Need to create the vehicles.config if DNE and read if it does
function populateVehicleProfileDropdown() {
  // get select ID, for file selection in current directory
  vehicleDropdown = document.getElementById('vehicle-profile-name');
	let selected = vehicleDropdown.selectedIndex;
	if (selected == -1) {selected = 0};
	// populate var with current files in directory based on OS
	if (os === "Windows") {
		try { // using 'r+' flag will throw exception when file doesn't exist
			// r+ flag means reading/writing
			vehiclesJSON = JSON.parse(fs.readFileSync('./vehicles.json', 'r+'));
		} catch(e) { // file doesn't exist, so create it (and add "None" vehicle option)
			// a+ open the file for reading/appending, creates file if does not exist
			let newFile = fs.openSync('./vehicles.json', 'a+');
			vehiclesJSON = {
				"None":
				{
					"received_ids": [],
					"labeled_ids": {},
					"notes": ""
				}
			};
			fs.writeSync(newFile, JSON.stringify(vehiclesJSON));
			fs.closeSync(newFile);
		}
	} else {  // MacOS/Linux
		// all comments from the os === "Windows" case apply here
		try {
			vehiclesJSON = JSON.parse(fs.readFileSync(process.cwd() + '/vehicles.json'));
		} catch(e) {
			let newFile = fs.openSync(process.cwd() + '/vehicles.json', 'a+');
			vehiclesJSON = {
				"None":
				{
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

/*
Allows user to add a vehicle to the list of vehicles. Also adds that vehicle to the
vehicles.config JSON file.
TODO (maybe): Just put all the new inputs and buttons in the HTML from the beginning,
but just hide them and then unhide them when the user clicks the + button.
TODO: Hide the input and button again after the user adds the vehicle.
*/
let addVehicleBtn = document.getElementById('add-vehicle-btn');
addVehicleBtn.addEventListener('click', () => {
  // create the DOM objects
  let newVehicleInput = document.createElement("input");
  newVehicleInput.setAttribute("id", "new-vehicle-input");
  let newVehicleBtn = document.createElement("button");
  newVehicleBtn.innerHTML = "Save vehicle";
  newVehicleBtn.setAttribute("id", "new-vehicle-btn");

  // add the new object to the DOM
  addVehicleBtn.insertAdjacentElement('afterend', newVehicleInput);
  //newVehicleInput.insertAdjacentElement("beforebegin", document.createElement('br'));
  newVehicleInput.insertAdjacentElement('afterend', newVehicleBtn);
  //newVehicleInput.insertAdjacentElement('afterend', document.createElement('br'));

  // make the new DOM elements useful
  newVehicleBtn.addEventListener('click', function() {
    let vehicleName = newVehicleInput.value;
    if (vehicleName) {  // add the vehicle to JSON file
      vehiclesJSON[vehicleName] = {
        vehicleName:
        {
          "received_ids": [],
          "labeled_ids": {},
          "notes": ""
        }
      };

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
    } else {
      alert("Can not store empty vehicle name");
    }
  });

});

// add a label to IDs
let idInput = document.getElementById('id-input');
let labelInput = document.getElementById('label-input');
document.getElementById('add-label-btn').addEventListener('click', () => {
	if (selectedVehicle !== "None" && selectedVehicle) {
		let id = idInput.value;  // string
		let idAsNumber = parseInt(id);
		let label = labelInput.value;
		if (!idAsNumber || !label) {
			console.log(`${idAsNumber}#${label}`);
			alert('Must enter ID and label');
			return; // error; nothing more should happen
		}
		// add the label to vehicles.json
		let labeledIdObject = vehiclesJSON[selectedVehicle].labeled_ids;
		if (labeledIdObject == undefined) {
			labeledIdObject = {idAsNumber: label};
		} else {
			labeledIdObject[idAsNumber] = label;
		}
		jsonString = JSON.stringify(vehiclesJSON);
		fs.writeSync(fs.openSync("vehicles.json", 'w'), jsonString);

		// update the count and message tables to reflect the new labels
		updateMessageTable(id, label);
		updateCountTable(id, label);
	} else {
		alert("Please select a vehicle to add ID label to")
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
const occurenceTableBody = document.getElementById('occurrence-table-body');
function updateCountTable(updateID, newLabel) {
	let updateRow = document.getElementById(updateID);
	updateRow.firstChild.innerHTML = newLabel;
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

populateVehicleProfileDropdown();
populateSelectFileDropdown();
