const fs = require('fs');
const path = require('path');

const getAllFiles = (dirPath, arrayOfFiles) => {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  
  files.forEach((file) => {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.jsx') || file.endsWith('.js')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });
  return arrayOfFiles;
};

const dirs = ['./src/app/admin', './src/app/client'];

dirs.forEach(dir => {
  const files = getAllFiles(dir, []);
  files.forEach(file => {
    // Skip layout and page.js because we already manually perfected them
    if (file.endsWith('layout.js') || file.endsWith('/page.js')) {
      if (file.includes('admin/page.js') || file.includes('client/page.js') || file.includes('admin/layout.js') || file.includes('client/layout.js')) {
        return; 
      }
    }
    
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;
    
    // Replace solid backgrounds with glass panels
    // Ensure we only replace standalone bg-white, not bg-white/50
    content = content.replace(/\bbg-white(?!(\/\d+|-))\b/g, 'glass-panel');
    
    // Increase roundness for Apple style
    content = content.replace(/rounded-xl/g, 'rounded-2xl');
    content = content.replace(/rounded-2xl/g, 'rounded-3xl');
    content = content.replace(/rounded-lg/g, 'rounded-xl');
    
    // Soften borders
    content = content.replace(/border-gray-200/g, 'border-white/60');
    content = content.replace(/border-gray-100/g, 'border-white/40');
    
    if(originalContent !== content) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated', file);
    }
  });
});
