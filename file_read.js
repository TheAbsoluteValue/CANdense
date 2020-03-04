const tableify = require('tableify');
const Readline = require('@serialport/parser-readline');
const fs = require('fs');


var dataJson = {
  "_id": "1",
  "title": "2010 Honda Accord",
  "data": [{
    "ID": "1",
    "Message": "some data",
    "Time": "UTC",
    "Count": 1
  }],
  "label": "",
  "note": ""
};

document.getElementById('read-btn').addEventListener('click', () => {
  let filePath = document.getElementById('logfile-path').value;
  if (!filePath) {
    alert("Please enter a file path");
  } else {
    readLogFile(filePath);
  }
});

function readLogFile(path) {
	let logFileStream = fs.createReadStream(path);
	// parser will emit data any time a newline occurs
	const parser = logFileStream.pipe(new Readline());
	let messageCounts = {}; // counts the number of occurrences of each ID

	parser.on('data', data => {
		let dataSplit = data.toString().split(' ');
		if (dataSplit[2]) {
			// get the ID and message data
			let id = dataSplit[2].slice(0, 3);
			let messageData = dataSplit[2].slice(4);

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
			if (messageCounts[id]) {
				messageCounts[id]++;
			} else {
				messageCounts[id] = 0;
			}

			// add to the table that
			let tableBody = document.querySelector('#table table tbody');
			let newRow = document.createElement("tr");
			let idElement = document.createElement('td');
			idElement.className = "string";
			idElement.textContent = id;
			let dataElement = document.createElement('td');
			dataElement.className = "string";
			dataElement.textContent = messageData;
			let timeStampElement = document.createElement('td');
			timeStampElement.className = "string";
			timeStampElement.textContent = timeString;
			newRow.appendChild(idElement);
			newRow.appendChild(dataElement);
			newRow.appendChild(timeStampElement);
			tableBody.appendChild(newRow);
		}
	});

	// try {
  //   fs.readFile(path, {
  //     encoding: 'utf-8',
  //     flag: 'r'
  //   }, (err, data) => {
  //     console.log(path);
  //     if (data) { // file is not empty
  //       // split the log file on each line, then go through and push necessary elements to JSON
  //       lineSplit = data.toString().split('\n');
  //       for (var i = 0; i <= lineSplit.length - 1; i++) {
  //         if (lineSplit[i] !== '') {
  //           let dataSplit = lineSplit.toString().split(' ');
  //           // TODO: this is if(...) just a bandaid; sometimes dataSolut[2] is undefined... not sure why
  //           if (dataSplit[2]) {
  //             // get the ID and message data
  //             let id = dataSplit[2].slice(0, 3);
  //             let messageData = dataSplit[2].slice(4);
	//
  //             // make timestamp human-readable
  //             let unixTimeStamp = dataSplit[0].slice(1, -1);
  //             let date = new Date(parseFloat(unixTimeStamp));
  //             let hours = date.getHours();
  //             let minutes = date.getMinutes();
  //             let seconds = date.getSeconds();
  //             let milliseconds = date.getMilliseconds();
  //             let arr = [hours, minutes, seconds, milliseconds];
  //             let timeString = [hours, minutes, seconds, milliseconds].join(':');
	//
              // dataJson.data.push({
              //   "ID": id,
              //   "Message": messageData,
              //   "Time": timeString
              // });
  //           }
  //         }
  //       }
	//
  //       // sort by ID, store in temp JSON obj
  //       var sortedDataJson = sortById(dataJson.data);
	//
  //       // get number of messages for each ID, will be seperate table
  //       var occurences = {};
  //       // reduce the sorted data JSON to an object of key-value -> id: count
  //       occurences = countMessagesById(sortedDataJson);
  //       // convert the object to an array
  //       occurencesArr = Object.entries(occurences);
  //       // sort the array, because for some reason it's unsorted now
  //       occurencesArr = sortOccurencesArray(occurencesArr);
  //       // give headers to array - for UI table purposes
  //       occurencesArr.unshift(["ID", "Count"]);
	//
  //       // store title, note, data for use with DOM
  //       var title = dataJson['title'];
  //       var note = dataJson['note'];
  //       var message = sortedDataJson;
	//
  //       // if you want unsorted, use line below instead of line above
  //       // var message = dataJson['data'];
	//
        // create tables from JSON data array
        // var occurencesHtml = tableify(occurencesArr);
        // var html = tableify(message);
	//
  //       // write to DOM
  //       document.getElementById("carMake").innerHTML = title ? title : 'CanDense';
  //       document.getElementById("notes").innerHTML = note ? note : 'notes';
  //       document.getElementById("occurenceTable").innerHTML = occurencesHtml;
  //       document.getElementById("table").innerHTML = html;
	//
  //       // make sure preceding is done within callback
  //     } else {
  //       alert('The file is empty');
  //     }
  //   });
  // } catch (e) {
  //   alert(`${path} does not exist`);
  // }
}


// sort by ID, then combine like messages within same ID
function sortById(data) {
  return data.sort((a, b) => (a.ID > b.ID) ? 1 : -1);
}

// reduce sortedData object to count the number of occurences of each ID. reduce(accumulator, current_val)
function countMessagesById(data) {
  const result = data.reduce(function(msgs, val) {
    msgs[val.ID] = (msgs[val.ID] || 0) + 1;
    return msgs;
  }, {});
  return result;
}

// needed this for sorting array of message occurences per ID
function sortOccurencesArray(arr) {
  return arr.sort((a, b) => (a[0] > b[0]) ? 1 : -1);
}
