const fs = require('fs');
const path = './data.json';
const tableify = require('tableify');

try {
    // if file exists
    if (fs.existsSync(path)) {
        // parse JSON file
        var data = JSON.parse(fs.readFileSync(path));

        // store title, note, data
        var title = data['title'];
        var note = data['note'];
        var messages = data['data'];

        // create table from JSON data array
        var html = tableify(messages);

        // write to DOM
        document.getElementById("carMake").innerHTML = title ? title : 'CanDense' ;
        document.getElementById("notes").innerHTML = note ? note : 'notes';
        document.getElementById("table").innerHTML = html;
    } else { 
        console.log('file not found!');
    }   
} catch (err) {
    console.error(err);
}