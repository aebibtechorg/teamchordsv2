const fs = require('fs');

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `${r} ${g} ${b}`;
}

const cssFile = '/Users/paul/Desktop/dev/teamchordsv2/blog/src/styles/global.css';
let css = fs.readFileSync(cssFile, 'utf8');

css = css.replace(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})/g, (match, p1, p2) => {
  return `--${p1}: ${hexToRgb(p2)}`;
});

fs.writeFileSync(cssFile, css);

const twFile = '/Users/paul/Desktop/dev/teamchordsv2/blog/tailwind.config.js';
let tw = fs.readFileSync(twFile, 'utf8');

tw = tw.replace(/var\(--([a-z-]+)\)/g, 'rgb(var(--$1) / <alpha-value>)');

fs.writeFileSync(twFile, tw);
console.log('Done');
