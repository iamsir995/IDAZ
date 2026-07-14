const fs = require('fs');
const file = 'src/app/admin/layout.js';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/user\.role === 'client'/g, "['client'].includes(user.role)");
  fs.writeFileSync(file, content);
  console.log('Fixed layout.js');
}
