const tableify = require('tableify');
const path = './data.json';
const rendererPath = './renderer.js';
const fs = require('fs');

// creates a file object for the file the user chose from the file input
// once the file is set, it calls the function that will actually read it
document.getElementById('set-path-btn').addEventListener('click', () => {
	let filePath = document.getElementById('logfile-path').value;
	if (!filePath) {
		alert("Please enter a file path");
	} else {
		readLogFile(filePath);
	}
});

function readLogFile(path) {
	try {
		fs.readFile(path, 'r', 'utf-8', (err, data) => {
			if(data){
					// split the log file on each line, then go through and push necessary elements to JSON
					lineSplit = data.toString().split('\n');
					for(var i = 0; i <= lineSplit.length - 1; i++) {
							if(lineSplit[i] !== '') {
							var timestamp = lineSplit[i].substring(0, 19);
							var id = lineSplit[i].substring(25, 28);
							var info = lineSplit[i].substring(29, lineSplit[i].length);
							dataJson.data.push({"ID":id,"Message":info,"Time":timestamp,"Count":1});
							}
					}

					// sort by ID, store in temp JSON obj
					var sortedDataJson = sortById(dataJson.data);

					// get number of messages for each ID, will be seperate table
					var occurences = {};
					// reduce the sorted data JSON to an object of key-value -> id: count
					occurences = countMessagesById(sortedDataJson);
					// convert the object to an array
					occurencesArr = Object.entries(occurences);
					// sort the array, because for some reason it's unsorted now
					occurencesArr = sortOccurencesArray(occurencesArr);
					// give headers to array - for UI table purposes
					occurencesArr.unshift(["ID", "Count"]);

					// store title, note, data for use with DOM
					var title = dataJson['title'];
					var note = dataJson['note'];
					var message = sortedDataJson;

					// if you want unsorted, use line below instead of line above
					// var message = dataJson['data'];

					// create tables from JSON data array
					var occurencesHtml = tableify(occurencesArr);
					var html = tableify(message);

					// write to DOM
					document.getElementById("carMake").innerHTML = title ? title : 'CanDense';
					document.getElementById("notes").innerHTML = note ? note : 'notes';
					document.getElementById("occurenceTable").innerHTML = occurencesHtml;
					document.getElementById("table").innerHTML = html;

					// make sure preceding is done within callback
			} else {
				alert('The file is empty');
			}
		});
	} catch (e) {
		alert(`${path} does not exist`);
	}
}




















//
// var dataJson = {
// 	"_id": "1",
// 	"title": "2010 Honda Accord",
// 	"data": [{
//         "ID": "1",
// 		"Message": "some data",
// 		"Time": "UTC",
// 		"Count": 1
//     }],
//     "Count": 1,
// 	"label": "",
// 	"note": ""
// };
//
// try {
//     // if file exists
//     if (fs.existsSync(logPath)) {
//         // parse JSON file - no longer needed but could be useful
//         // var data = JSON.parse(fs.readFileSync(path));
//
//         // parse Log file
//         var data = fs.readFile(logPath, 'utf-8', (err, data) => {
//             if(err) {
//                 console.error(err);
//             }
            // if(data){
            //     // split the log file on each line, then go through and push necessary elements to JSON
            //     lineSplit = data.toString().split('\n');
            //     for(var i = 0; i <= lineSplit.length - 1; i++) {
            //         if(lineSplit[i] !== '') {
            //         var timestamp = lineSplit[i].substring(0, 19);
            //         var id = lineSplit[i].substring(25, 28);
            //         var info = lineSplit[i].substring(29, lineSplit[i].length);
            //         dataJson.data.push({"ID":id,"Message":info,"Time":timestamp,"Count":1});
            //         }
            //     }
            //     // console.log(dataJson);
						//
            //     // sort by ID, store in temp JSON obj
            //     var sortedDataJson = sortById(dataJson.data);
						//
            //     // get number of messages for each ID, will be seperate table
            //     var occurences = {};
            //     // reduce the sorted data JSON to an object of key-value -> id: count
            //     occurences = countMessagesById(sortedDataJson);
            //     // convert the object to an array
            //     occurencesArr = Object.entries(occurences);
            //     // sort the array, because for some reason it's unsorted now
            //     occurencesArr = sortOccurencesArray(occurencesArr);
            //     // give headers to array - for UI table purposes
            //     occurencesArr.unshift(["ID", "Count"]);
						//
            //     // store title, note, data for use with DOM
            //     var title = dataJson['title'];
            //     var note = dataJson['note'];
            //     var message = sortedDataJson;
						//
            //     // if you want unsorted, use line below instead of line above
            //     // var message = dataJson['data'];
						//
            //     // create tables from JSON data array
            //     var occurencesHtml = tableify(occurencesArr);
            //     var html = tableify(message);
						//
            //     // write to DOM
            //     document.getElementById("carMake").innerHTML = title ? title : 'CanDense';
            //     document.getElementById("notes").innerHTML = note ? note : 'notes';
            //     document.getElementById("occurenceTable").innerHTML = occurencesHtml;
            //     document.getElementById("table").innerHTML = html;
						//
            //     // make sure preceding is done within callback
            // }
    //     });
    // } else {
    //     console.log('file not found!');
    // }
// } catch (err) {
//     console.error(err);
// }
//
// // sort by ID, then combine like messages within same ID
// function sortById(data) {
//     return data.sort((a, b) => (a.ID > b.ID) ? 1 : -1);
// }
//
// // reduce sortedData object to count the number of occurences of each ID. reduce(accumulator, current_val)
// function countMessagesById(data) {
//     const result = data.reduce(function(msgs, val) {
//         msgs[val.ID] = (msgs[val.ID] || 0) + 1;
//         return msgs;
//      }, {});
//      return result;
// }
//
// // needed this for sorting array of message occurences per ID
// function sortOccurencesArray(arr) {
//     return arr.sort((a, b) => (a[0] > b[0]) ? 1 : -1);
// }
