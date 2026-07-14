const fs = require('fs');
const path = require('path');

const fixes = [
  // Fix the broken var() values caused by previous bad regex
  {
    regex: /text-\[var\(--text-\[var\(--idaz-text-muted\)\] font-\[family-name:var\(--font-inter\)\] leading-relaxed\)\]/g,
    replacement: 'text-[var(--idaz-text-muted)]'
  },
  {
    regex: /border-\[var\(--inline-flex items-center gap-2 border-2 border-\[var\(--idaz-gray-mid\)\] text-\[var\(--idaz-black\)\] font-bold px-6 py-3 rounded-xl transition-all hover:border-\[var\(--idaz-black\)\] hover:bg-\[var\(--idaz-black\)\] hover:text-white-dark\)\]/g,
    replacement: 'border-[var(--idaz-orange-dark)]'
  },
  // Fix the duplicate text-[var(--idaz-black)] text-white or similar
  {
    regex: /text-\[var\(--idaz-black\)\] text-white/g,
    replacement: 'text-white'
  },
  // Fix other potential var(--idaz-heading-...) if any
  {
    regex: /text-4xl md:text-6xl lg:text-7xl font-black font-\[family-name:var\(--font-montserrat\)\] text-\[var\(--idaz-black\)\] text-white/g,
    replacement: 'text-4xl md:text-6xl lg:text-7xl font-black font-[family-name:var(--font-montserrat)] text-white'
  },
  {
    regex: /text-3xl md:text-4xl font-black font-\[family-name:var\(--font-montserrat\)\] text-\[var\(--idaz-black\)\] text-\[var\(--idaz-black\)\]/g,
    replacement: 'text-3xl md:text-4xl font-black font-[family-name:var(--font-montserrat)] text-[var(--idaz-black)]'
  }
];

// Additional CSS conversions
const additionalMap = {
  'idaz-card': 'bg-white rounded-2xl border border-[var(--idaz-gray-mid)] transition-all hover:-translate-y-2 hover:shadow-[0_24px_48px_rgba(0,0,0,0.1)]',
  'glass-nav': 'bg-white/90 backdrop-blur-xl border-b border-black/5 shadow-[0_4px_24px_rgba(0,0,0,0.06)]',
  'bg-orange-mesh': 'bg-gradient-to-br from-[#fff9f0] via-[#fff] to-[#fff5e0]',
  'step-connector': 'absolute top-1/2 -right-1/2 w-full h-[2px] bg-gradient-to-r from-[var(--idaz-orange)] to-transparent -translate-y-1/2 z-0',
  'testimonial-card': 'bg-white rounded-2xl p-8 border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)]',
  'idaz-link': 'relative after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[2px] after:bg-[var(--idaz-orange)] after:transition-all hover:after:w-full'
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

      // Apply fixes first
      for (const fix of fixes) {
        if (fix.regex.test(content)) {
          content = content.replace(fix.regex, fix.replacement);
          changed = true;
        }
      }

      // Apply remaining conversions safely using exact word boundary, ignoring if preceded by var(--
      for (const [cls, tailwind] of Object.entries(additionalMap)) {
        // Negative lookbehind is supported in modern Node
        const regex = new RegExp(`(?<!var\\(--)\\b${cls}\\b`, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, tailwind);
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Fixed ${fullPath}`);
      }
    }
  }
}

processDirectory('./src/components/public');
processDirectory('./src/app');
