// When the user selects a new vehicle, this event fires
function selectionChanged(event) {
  let newVehicleName = event.target.value;
}

// prepares for user to select item from drop down
function run() {
	let os = getOS();
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
    let vehicleNames = vehiclesJSON.keys();
    // populate select options
    vehicleNames.forEach(vehicleName => filePath.options.add(new Option(vehicleName)));
}

document.getElementById('select-vehicle-btn').addEventListener('click', () => {

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
});
