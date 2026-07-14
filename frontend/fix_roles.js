const fs = require('fs');
const files = [
  'src/app/login/page.js',
  'src/context/AuthContext.js',
  'src/app/master-login/page.js',
  'src/app/admin/page.js',
  'src/app/admin/support/page.js',
  'src/app/admin/support/[id]/page.js',
  'src/components/LiveChat.js',
  'src/components/Navigation.jsx',
  'src/components/VideoCallModal.jsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`Skipping ${file}`);
    return;
  }
  let content = fs.readFileSync(file, 'utf8');
  
  // Login & AuthContext
  content = content.replace(/user\.role === 'admin' \|\| user\.role === 'manager'/g, "['superadmin', 'admin', 'manager'].includes(user.role)");
  content = content.replace(/res\.data\?\.role === 'admin' \|\| res\.data\?\.role === 'manager'/g, "['superadmin', 'admin', 'manager'].includes(res.data?.role)");
  content = content.replace(/res\.data\.user\.role === 'admin' \|\| res\.data\.user\.role === 'manager'/g, "['superadmin', 'admin', 'manager'].includes(res.data.user.role)");
  content = content.replace(/meRes\.data\.data\.role === 'admin' \|\| meRes\.data\.data\.role === 'manager'/g, "['superadmin', 'admin', 'manager'].includes(meRes.data.data.role)");

  // Dashboard (admin/page.js)
  content = content.replace(/user\?\.role === 'admin' \|\| user\?\.role === 'manager'/g, "['superadmin', 'admin', 'manager'].includes(user?.role)");

  // Support / LiveChat / VideoCall / Navigation (General admin checks)
  content = content.replace(/msg\.role === 'admin'/g, "['superadmin', 'admin'].includes(msg.role)");
  content = content.replace(/msg\.sender\.role === 'admin'/g, "['superadmin', 'admin'].includes(msg.sender.role)");
  content = content.replace(/user\.role === 'admin'/g, "['superadmin', 'admin'].includes(user.role)");
  content = content.replace(/user\?\.role === 'admin'/g, "['superadmin', 'admin'].includes(user?.role)");
  content = content.replace(/res\.data\.user\.role === 'admin'/g, "['superadmin', 'admin'].includes(res.data.user.role)");
  
  fs.writeFileSync(file, content);
  console.log(`Fixed ${file}`);
});
