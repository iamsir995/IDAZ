const fs = require('fs');
const path = require('path');

const rules = [
  // Typography mapping
  { regex: /font-\[family-name:var\(--font-montserrat\)\]/g, replacement: 'font-montserrat' },
  { regex: /font-\[family-name:var\(--font-inter\)\]/g, replacement: 'font-sans' },
  
  // Custom colors mapping: [var(--idaz-orange)] -> idaz-orange
  // This will cover bg-[var(--idaz-orange)], text-[var(--idaz-gray)], border-[var(--idaz-gray-mid)] etc
  { regex: /\[var\(--idaz-([a-zA-Z0-9\-]+)\)\]/g, replacement: 'idaz-$1' },
  
  // Fix specifically broken regex replacements from the past
  { regex: /py-20 md:py-32-label/g, replacement: 'text-sm font-bold text-idaz-orange uppercase tracking-wider mb-2' },
  { regex: /py-20 md:py-32-title/g, replacement: 'text-3xl md:text-5xl font-black font-montserrat text-idaz-black' },
  { regex: /py-20 md:py-32-desc/g, replacement: 'text-idaz-text-muted font-sans leading-relaxed text-base' },

  // Clean up any double spaces that might occur
  { regex: /  +/g, replacement: ' ' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      for (const rule of rules) {
        if (rule.regex.test(content)) {
          content = content.replace(rule.regex, rule.replacement);
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Refactored ${fullPath}`);
      }
    }
  }
}

console.log('Starting Tailwind refactor...');
processDirectory('./src/components/public');
processDirectory('./src/app');
console.log('Refactor completed.');
