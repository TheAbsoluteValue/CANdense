const fs = require('fs');
const path = './data.json';
const tableify = require('tableify');

try {
    if (fs.existsSync(path)) {
        var data = JSON.parse(fs.readFileSync(path));
        var html = tableify(data);
        var table = document.createElement("tbody");
        table.appendChild(html);
        console.log(html);
    } else { 
        console.log('file not found!');
    }   
} catch (err) {
    console.error(err);
}