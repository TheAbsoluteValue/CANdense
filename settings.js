const fs = require('fs');
let os;
let vehiclesJSON;

// When the user selects a new vehicle, this event fires
function selectionChanged(event) {
  let newVehicleName = event.target.value;
}

// prepares for user to select item from drop down
function run() {
	os = getOS();
	populateSelectFileDropdown();
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

// retrieves the stored vehicle names and adds them to this list
// TODO: Need to create the vehicles.config if DNE and read if it does
function populateSelectFileDropdown() {
  // get select ID, for file selection in current directory
  // TODO: rename this variable and HTML ID
  let filePath = document.getElementById('vehicle-profile-path');
	// populate var with current files in directory based on OS
	if (os === "Windows") {
		vehiclesJSON = JSON.parse(fs.readFileSync('./vehicles.json'));
	} else {
		vehiclesJSON = JSON.parse(fs.readFileSync(process.cwd() + '/vehicles.json'));
	}
  /*
  clear the list of options so that when adding a new vehicle,
  the old ones don't appear multiple times. Elements need to be removed in reverse orderhttps://stackoverflow.com/questions 3364493/how-do-i-clear-all-options-in-a-dropdown-box
  */
  for (i = filePath.options.length - 1; i >= 0; i--) {
    filePath.options.remove(i);
  }
  // keys of vehiclesJSON is the name of the vehicle
  let vehicleNames = Object.keys(vehiclesJSON);
  // populate select options
  vehicleNames.forEach(vehicleName => filePath.options.add(new Option(vehicleName)));
}

document.getElementById('select-vehicle-btn').addEventListener('click', () => {
  let JSONdata = JSON.parse()
});

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
  newVehicleInput.insertAdjacentElement("beforebegin", document.createElement('br'));
  newVehicleInput.insertAdjacentElement('afterend', newVehicleBtn);
  newVehicleInput.insertAdjacentElement('afterend', document.createElement('br'));

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
      populateSelectFileDropdown();
    } else {
      alert("Can not store empty vehicle name");
    }
  });

});


run();
