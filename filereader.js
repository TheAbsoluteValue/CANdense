const tableify = require('tableify');
const path = './data.json';
const rendererPath = './renderer.js';
const logPath = './test_CANdump1_abbreviated.log';

var dataJson = {
	"_id": "1",
	"title": "2010 Honda Accord",
	"data": [{
		"ID": "1",
		"message": "some data",
		"time": "UTC",
		"count": 1
	}],
	"label": "",
	"note": ""
};

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
                    dataJson.data.push({"ID":id,"message":info,"time":timestamp,"count":1});
                    }
                }
                // console.log(dataJson);

                // make sure proceding is done within the callback

                // store title, note, data for use with DOM
                var title = dataJson['title'];
                var note = dataJson['note'];
                var message = dataJson['data'];

                // create table from JSON data array
                var html = tableify(message);
                    
                // write to DOM
                document.getElementById("carMake").innerHTML = title ? title : 'CanDense';
                document.getElementById("notes").innerHTML = note ? note : 'notes';
                document.getElementById("table").innerHTML = html;
            }
        });
    } else { 
        console.log('file not found!');
    }   
} catch (err) {
    console.error(err);
}