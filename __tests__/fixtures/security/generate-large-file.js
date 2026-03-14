#!/usr/bin/env node
/**
 * Generate a large (100MB+) XML file for resource limit testing
 * This is generated on-demand during tests to avoid committing large files
 */

const fs = require('fs');
const path = require('path');

function generateLargeFile(filename, targetSizeMB = 100) {
  const stream = fs.createWriteStream(filename);
  
  stream.write('<?xml version="1.0"?>\n');
  stream.write('<coverage line-rate="0.75" branch-rate="0.5" lines-covered="75000" lines-valid="100000">\n');
  stream.write('  <packages>\n');
  stream.write('    <package name="LargePackage" line-rate="0.75" branch-rate="0.5">\n');
  stream.write('      <classes>\n');
  
  // Calculate how many lines needed to reach target size
  const lineTemplate = '        <class name="Class{INDEX}" filename="file{INDEX}.js" line-rate="0.75" branch-rate="0.5"><methods/><lines>';
  const linesPerClass = 1000;
  const approximateLineSize = 100; // bytes
  const targetBytes = targetSizeMB * 1024 * 1024;
  const classesNeeded = Math.ceil(targetBytes / (linesPerClass * approximateLineSize));
  
  for (let i = 0; i < classesNeeded; i++) {
    stream.write(`        <class name="Class${i}" filename="file${i}.js" line-rate="0.75" branch-rate="0.5">\n`);
    stream.write('          <methods/>\n');
    stream.write('          <lines>\n');
    
    for (let j = 0; j < linesPerClass; j++) {
      stream.write(`            <line number="${j + 1}" hits="${j % 2}"/>\n`);
    }
    
    stream.write('          </lines>\n');
    stream.write('        </class>\n');
  }
  
  stream.write('      </classes>\n');
  stream.write('    </package>\n');
  stream.write('  </packages>\n');
  stream.write('</coverage>\n');
  
  stream.end();
  
  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      const stats = fs.statSync(filename);
      console.log(`Generated ${filename}: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      resolve(filename);
    });
    stream.on('error', reject);
  });
}

if (require.main === module) {
  const outputFile = path.join(__dirname, 'large-file.xml');
  generateLargeFile(outputFile, 100).catch(console.error);
}

module.exports = { generateLargeFile };
