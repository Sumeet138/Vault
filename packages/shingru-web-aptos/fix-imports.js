#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('\x1b[32m%s\x1b[0m', 'Fixing import paths...');
console.log('');

// Get all files recursively
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
      }
    } else {
      if (/\.(ts|tsx|js|jsx)$/.test(file)) {
        arrayOfFiles.push(filePath);
      }
    }
  });

  return arrayOfFiles;
}

const srcPath = path.join(__dirname, 'src');
const files = getAllFiles(srcPath);

let modifiedFiles = 0;

files.forEach((filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Fix import paths
    content = content.replace(/@\/lib\/@pivy/g, '@/lib/@shingru');
    content = content.replace(/pivy-stealth-iota/g, 'shingru-stealth-aptos');
    content = content.replace(/PivyLogo/g, 'ShingruLogo');
    content = content.replace(/BlackPivyIcon/g, 'BlackShingruIcon');
    content = content.replace(/pivy-demo\.webp/g, 'shingru-demo.webp');
    content = content.replace(/IotaWalletProvider/g, 'AptosWalletProvider');
    content = content.replace(/IotaPayButton/g, 'AptosPayButton');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      modifiedFiles++;
      const relativePath = path.relative(process.cwd(), filePath);
      console.log('\x1b[32m%s\x1b[0m', `✓ Fixed: ${relativePath}`);
    }
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `✗ Error: ${filePath}: ${error.message}`);
  }
});

console.log('');
console.log('\x1b[32m%s\x1b[0m', `Fixed ${modifiedFiles} files`);
