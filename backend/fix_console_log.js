const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('console.log') && !lines[i].includes('process.env.NODE_ENV')) {
    lines[i] = lines[i].replace('console.log', "if (process.env.NODE_ENV !== 'production') console.log");
  }
}
fs.writeFileSync(filePath, lines.join('\n'));
console.log('Fixed console.log in server.js');
