const tableify = require('tableify');
const path = './data.json';
const rendererPath = './renderer.js';
const logPath = './test_CANdump1_abbreviated.log';

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

var sortedDataJson = {};

try {
    // if file exists
    if (fs.existsSync(logPath)) {
        // parse JSON file - no longer needed but could be useful
        // var data = JSON.parse(fs.readFileSync(path));

        // parse Log file
        var data = fs.readFile(logPath, 'utf-8', (err, data) => {
            if(err) {
                console.error(err);
            }
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
                // console.log(dataJson);

                // sort by ID, store in obj
                var sortedDataJson = sortById(dataJson.data);

                // store title, note, data for use with DOM
                var title = dataJson['title'];
                var note = dataJson['note'];
                var message = sortedDataJson;

                // create table from JSON data array
                var html = tableify(message);
                    
                // write to DOM
                document.getElementById("carMake").innerHTML = title ? title : 'CanDense';
                document.getElementById("notes").innerHTML = note ? note : 'notes';
                document.getElementById("table").innerHTML = html;

                // make sure preceding is done within callback
            }
        });
    } else { 
        console.log('file not found!');
    }   
} catch (err) {
    console.error(err);
}

// sort by ID, then combine like messages within same ID
function sortById(data) {
    return data.sort((a, b) => (a.ID > b.ID) ? 1 : -1);
}