const fs = require('fs');

console.log("Reading giant 3MB JS file...");
const pathIn = 'js/local_states.js';
const pathOut = 'datasets/local_states.json';

try {
    let content = fs.readFileSync(pathIn, 'utf8');
    
    // Strip Javascript variable declarations natively
    content = content.replace('const localGeoJSON = ', '').trim();
    if (content.endsWith(';')) content = content.slice(0, -1);
    
    // Parse to ensure valid geometry payload locally
    const data = JSON.parse(content);
    
    console.log("JSON Parsed successfully! Minifying and removing whitespace...");
    
    // Stringify horizontally without indentations to compress MBs
    fs.writeFileSync(pathOut, JSON.stringify(data));
    
    console.log(`Success! The file was crushed into ${pathOut}. You can now safely delete the massive ${pathIn} script!`);
    
} catch (err) {
    console.error("Oops! Something went wrong during minification:", err.message);
}
