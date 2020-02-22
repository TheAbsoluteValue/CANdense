const fs = require('fs');
const path = './data.json';
const tableify = require('tableify');

try {
    if (fs.existsSync(path)) {
        var data = JSON.parse(fs.readFileSync(path));
        var title = data['title'];
        var note = data['note'];
        var messages = data['data'];
        var html = tableify(messages);
        document.getElementById("carMake").innerHTML = title ? title: 'CanDense' ;
        document.getElementById("notes").innerHTML = note ? note: 'notes';
        document.getElementById("table").innerHTML = html;
    } else { 
        console.log('file not found!');
    }   
} catch (err) {
    console.error(err);
}