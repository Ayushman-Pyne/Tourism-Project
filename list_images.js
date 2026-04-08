const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'datasets', 'data');
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

let totalImages = 0;

files.forEach(file => {
    const filePath = path.join(dataDir, file);
    const raw = fs.readFileSync(filePath, 'utf-8').trim();

    // Skip empty or placeholder files
    if (!raw || raw === '{}' || raw === '') return;

    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch (e) {
        console.error(`⚠  Could not parse ${file}: ${e.message}`);
        return;
    }

    const states = parsed.states || {};
    const stateNames = Object.keys(states);
    if (stateNames.length === 0) return;

    console.log('\n' + '═'.repeat(60));
    console.log(`  FILE: ${file}`);
    console.log('═'.repeat(60));

    stateNames.forEach(stateName => {
        const stateData = states[stateName];
        const sections = stateData.sections || [];

        sections.forEach(section => {
            const items = section.items || [];
            items.forEach(item => {
                totalImages++;
                console.log(`\n  [${totalImages}] ${item.title}`);
                console.log(`      Category : ${item.category}`);
                console.log(`      City     : ${item.city}`);
                console.log(`      Image    : ${item.image}`);
            });
        });
    });
});

console.log('\n' + '═'.repeat(60));
console.log(`  TOTAL IMAGES FOUND: ${totalImages}`);
console.log('═'.repeat(60) + '\n');
