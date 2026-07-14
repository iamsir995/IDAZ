const fs = require('fs');
const path = require('path');

const cssMap = {
  'idaz-container': 'max-w-7xl mx-auto px-6 md:px-12 w-full',
  'idaz-section': 'py-20 md:py-32',
  'idaz-heading-1': 'text-4xl md:text-6xl lg:text-7xl font-black font-[family-name:var(--font-montserrat)] text-[var(--idaz-black)]',
  'idaz-heading-2': 'text-3xl md:text-4xl font-black font-[family-name:var(--font-montserrat)] text-[var(--idaz-black)]',
  'idaz-heading-3': 'text-xl font-bold font-[family-name:var(--font-montserrat)] text-[var(--idaz-black)]',
  'idaz-text-muted': 'text-[var(--idaz-text-muted)] font-[family-name:var(--font-inter)] leading-relaxed',
  'idaz-btn-primary': 'inline-flex items-center gap-2 bg-[var(--idaz-orange)] text-white font-bold px-6 py-3 rounded-xl transition-all hover:bg-[var(--idaz-orange-dark)] hover:shadow-lg hover:shadow-orange-500/30',
  'idaz-btn-outline-dark': 'inline-flex items-center gap-2 border-2 border-[var(--idaz-gray-mid)] text-[var(--idaz-black)] font-bold px-6 py-3 rounded-xl transition-all hover:border-[var(--idaz-black)] hover:bg-[var(--idaz-black)] hover:text-white',
  'idaz-btn-outline': 'inline-flex items-center gap-2 border-2 border-white/20 text-white font-bold px-6 py-3 rounded-xl transition-all hover:bg-white/10',
  'idaz-section-label': 'inline-flex items-center gap-2 text-[var(--idaz-orange)] text-xs font-bold tracking-widest uppercase',
  'idaz-highlight': 'text-[var(--idaz-orange)]',
  'bg-hero-gradient': 'bg-gradient-to-br from-[var(--idaz-black)] to-gray-900',
};

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
      for (const [cls, tailwind] of Object.entries(cssMap)) {
        // Regex to match the exact class name
        const regex = new RegExp(`\\b${cls}\\b`, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, tailwind);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory('./src/components/public');
processDirectory('./src/app');
