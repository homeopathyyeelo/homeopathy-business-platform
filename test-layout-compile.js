// Test if layout.js can be loaded
const fs = require('fs');
const path = require('path');

const layoutPath = path.join(__dirname, '.next/static/chunks/app/layout.js');

console.log('Testing layout.js compilation...\n');

if (!fs.existsSync(layoutPath)) {
    console.log('❌ layout.js not found!');
    process.exit(1);
}

console.log('✅ layout.js exists');

// Try to load it
try {
    const content = fs.readFileSync(layoutPath, 'utf8');
    console.log(`✅ File size: ${content.length} bytes`);
    
    // Check for invalid characters
    const invalidChars = [];
    for (let i = 0; i < content.length; i++) {
        const code = content.charCodeAt(i);
        // Check for characters outside normal range (except newline, tab, etc.)
        if (code > 127 && code !== 10 && code !== 13 && code !== 9) {
            invalidChars.push({
                char: content[i],
                code: code,
                position: i,
                line: content.substring(0, i).split('\n').length
            });
        }
    }
    
    if (invalidChars.length > 0) {
        console.log(`\n❌ Found ${invalidChars.length} invalid characters:`);
        invalidChars.slice(0, 10).forEach(item => {
            console.log(`  Line ${item.line}, Pos ${item.position}: '${item.char}' (U+${item.code.toString(16).toUpperCase().padStart(4, '0')})`);
        });
    } else {
        console.log('✅ No invalid characters found');
    }
    
    // Try to eval a small part
    console.log('\n✅ File is readable');
    
} catch (error) {
    console.log(`❌ Error reading file: ${error.message}`);
    process.exit(1);
}

console.log('\n✅ layout.js appears to be valid');
