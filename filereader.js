const fs = require('fs');
const path = './data.json';

try {
    if (fs.existsSync(path)) {
        let data = fs.readFileSync(path);
        let parsedData = JSON.parse(data);
        console.log(parsedData);
    } else { 
        console.log('file not found!');
    }   
} catch (err) {
    console.error(err);
}