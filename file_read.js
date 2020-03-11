const tableify = require('tableify');
const Readline = require('@serialport/parser-readline');
const fs = require('fs');

let os;
var fileOptions;

function run() {
	os = getOS();
	populateSelectFileDropdown();
	registerFileBtn();
}

// register read file button click listener
function registerFileBtn() {
	document.getElementById('read-btn').addEventListener('click', () => {
		if (!selectedPath) {
			alert("Please enter a file path");
		} else {
			readLogFile(selectedPath);
		}
	});
}

run();

function readLogFile(path) {
	let logFileStream = fs.createReadStream(path);
	// parser will emit data any time a newline occurs
	const parser = logFileStream.pipe(new Readline());
	// ID: count
	const idCounts = {};
	// the point at which we will append a row for each message
	const messageTBody = document.getElementById("message-table-body");

// when are done reading (and therefore counting), we can create the table that counts the variable
	logFileStream.on('end', () => {
		let occurrenceTableBody = document.getElementById('occurrence-table-body');
		// array version of the object that has ID: count
		let idCountEntries = sortOccurrencesArray(Object.entries(idCounts));
		idCountEntries.forEach(item => {
			var newRow = document.createElement("tr");
			var idCol = document.createElement("td");
			idCol.className = "string";
			idCol.textContent = item[0];
			var countCol = document.createElement("td");
			countCol.className = "string";
			countCol.textContent = item[1];

			newRow.appendChild(idCol);
			newRow.appendChild(countCol);
			occurrenceTableBody.appendChild(newRow);
		});

		//occurrenceTableContainer.innerHTML = occurrenceTable;
	});

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
			} else {
				idCounts[id] = 0;
			}

			// add message to the table
			let newRow = document.createElement('tr');
			let idTd = document.createElement('td');
			idTd.className = "string";
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


function populateSelectFileDropdown() {
    // get select ID, for file selection in current directory
    let filePath = document.getElementById('logfile-path');
	// populate var with current files in directory based on OS
	if (os === "Windows") {
		fileOptions = fs.readdirSync('./');
	} else {
		fileOptions = fs.readdirSync(process.cwd());
	}
    // filter above to only include log files
    var logFiles = fileOptions.filter(file => file.endsWith('.log'));
    // populate select options
    logFiles.forEach(option => filePath.options.add(new Option(option)));
}

// on file change, return a string of the correct path depending on OS
function selectionChanged(event) {
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
