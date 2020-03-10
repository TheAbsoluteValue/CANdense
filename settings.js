// When the user selects a new vehicle, this event fires
function selectionChanged(event) {
  newVehicleName = event.target.value;
}

// prepares for user to select item from drop down
function run() {
	os = getOS();
	populateSelectFileDropdown();
	registerFileBtn();
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
  let filePath = document.getElementById('vehicle-profile-path');
	// populate var with current files in directory based on OS
  let vehiclesJSON;
	if (os === "Windows") {
		vehiclesJSON = JSON.parse(fs.readFileSync('./vehicles.config'));
	} else {
		vehiclesJSON = JSON.parse(fs.readFileSync(process.cwd() + '/vehicles.config'));
	}
    // keys of vehiclesJSON is the name of the vehicle
    var vehicleNames = vehiclesJSON.keys();
    // populate select options
    vehicleNames.forEach(vehicleName => filePath.options.add(new Option(vehicleName)));
}

document.getElementById('select-vehicle-btn').addEventListener('click', () => {

});
