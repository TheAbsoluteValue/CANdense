const fs = require('fs');
const path = 'C:/Users/Ryan/Desktop/JSON.json';

try {
    if (fs.existsSync(path)) {
        let data = fs.readFileSync(path);
        console.log(data);
        let parseData = JSON.parse(data);
        console.log(parseData);
    } else { 
        console.log('file not found!');
    }   
} catch (err) {
    console.error(err);
}