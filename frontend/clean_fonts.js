const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else if (dirFile.endsWith('.js') || dirFile.endsWith('.jsx')) {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const files = walkSync('/Users/admin/Lập trình/dev-project/frontend/src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace: fontFamily: "'Montserrat', sans-serif",
  content = content.replace(/fontFamily:\s*(['"`])(?:'Montserrat'|'Inter').*?\1\s*,?/g, '');
  
  // Replace: style={{ fontFamily: 'inherit' }} -> style={{}}
  content = content.replace(/style=\{\{\s*fontFamily:\s*(['"`]).*?\1\s*\}\}/g, '');

  // Cleanup empty style={{ }} or style={{, }}
  content = content.replace(/style=\{\{\s*,?\s*\}\}/g, '');
  
  fs.writeFileSync(file, content, 'utf8');
});

console.log('Fonts cleaned up!');
