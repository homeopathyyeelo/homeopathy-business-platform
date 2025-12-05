/**
 * MANUAL COOKIE EXTRACTION GUIDE
 * Run this in your browser console (F12 → Console tab)
 */

// Step 1: Make sure you're on business.google.com
// Step 2: Open console (F12 → Console)
// Step 3: Paste this code and press Enter:

const cookies = document.cookie.split(';').map(c => {
    const [name, value] = c.trim().split('=');
    return {
        name: name,
        value: value,
        domain: '.google.com',
        path: '/',
        expires: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: false,
        secure: true,
        sameSite: 'None'
    };
});

// Step 4: Copy the output
console.log(JSON.stringify(cookies, null, 2));
console.log(`\n✅ Copy the JSON above and save to: services/automation-service/cookies.json`);
