const fs = require('fs');
const file = 'src/app/client/chat/page.js';
let content = fs.readFileSync(file, 'utf8');

// Change AdminChat to ClientChat
content = content.replace(/AdminChat/g, 'ClientChat');

// Avoid fetching all users (which clients probably can't do)
// Change fetchUsers to fetchContacts (maybe API supports it?)
// Actually, let's just let it fetch channels.
// In admin chat, it fetches: api.get('/users/contacts') ? Let's see.

fs.writeFileSync(file, content);
