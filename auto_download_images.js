/**
 * auto_download_images.js
 *
 * Automatically searches Pexels for every item in your JSON data files,
 * picks the first UNIQUE photo per item, downloads it to Imgs/,
 * and patches all JSON files to point to the local path.
 *
 * Usage:
 *   node auto_download_images.js YOUR_PEXELS_API_KEY
 *
 * Example:
 *   node auto_download_images.js abc123xyz456
 */

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

// ── API Key ────────────────────────────────────────────────────────────────────
const API_KEY = process.argv[2];
if (!API_KEY) {
    console.error('\n❌  No API key provided.');
    console.error('   Usage: node auto_download_images.js YOUR_PEXELS_API_KEY\n');
    process.exit(1);
}

// ── Output folder ──────────────────────────────────────────────────────────────
const OUTPUT_DIR = path.join(__dirname, 'images');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
const DATA_DIR = path.join(__dirname, 'datasets', 'data');

// ── Sleep helper ───────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── HTTP GET (API calls, with Auth header, JSON response) ──────────────────────
function apiGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { Authorization: API_KEY } }, res => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => resolve({
                status: res.statusCode,
                remaining: parseInt(res.headers['x-ratelimit-remaining'] || '999'),
                reset: parseInt(res.headers['x-ratelimit-reset'] || '0'),
                body
            }));
        }).on('error', reject);
    });
}

// ── Binary file downloader (follows redirects, no auth header needed) ──────────
function downloadFile(url, dest, redirects = 0) {
    if (redirects > 5) return Promise.reject(new Error('Too many redirects'));
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(dest);
        lib.get(url, res => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                file.close();
                try { fs.unlinkSync(dest); } catch (_) {}
                return downloadFile(res.headers.location, dest, redirects + 1)
                    .then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                file.close();
                try { fs.unlinkSync(dest); } catch (_) {}
                return reject(new Error(`HTTP ${res.statusCode}`));
            }
            res.pipe(file);
            file.on('finish', () => file.close(resolve));
            file.on('error', reject);
        }).on('error', err => {
            file.close();
            try { fs.unlinkSync(dest); } catch (_) {}
            reject(err);
        });
    });
}

// ── Load all items from JSON data files ────────────────────────────────────────
function loadAllItems() {
    const allItems   = [];
    const parsedFiles = {};

    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));

    files.forEach(file => {
        const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8').trim();
        if (!raw || raw === '{}') return;
        try {
            const parsed = JSON.parse(raw);
            parsedFiles[file] = parsed;
            const states = parsed.states || {};
            Object.entries(states).forEach(([stateName, stateData]) => {
                (stateData.sections || []).forEach(section => {
                    (section.items || []).forEach(item => {
                        allItems.push({ file, stateName, item });
                    });
                });
            });
        } catch (e) {
            console.error(`⚠  Could not parse ${file}: ${e.message}`);
        }
    });

    return { allItems, parsedFiles };
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
    const { allItems, parsedFiles } = loadAllItems();
    console.log(`\n📦  Found ${allItems.length} items across ${Object.keys(parsedFiles).length} files.`);
    console.log(`📁  Saving images to: ${OUTPUT_DIR}\n`);

    const usedPhotoIds = new Set();
    const mapping      = {}; // itemId → relative local path
    let downloaded = 0;
    let failed     = 0;

    for (let i = 0; i < allItems.length; i++) {
        const { item, stateName } = allItems[i];
        const keyword  = `${item.title} India`;
        const label    = `[${String(i + 1).padStart(3, ' ')}/${allItems.length}]`;

        process.stdout.write(`${label} ${item.title.substring(0, 45).padEnd(45)} → `);

        try {
            // Build search URL — request 15 so we have fallbacks for uniqueness
            const searchUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=15&orientation=landscape`;
            const resp = await apiGet(searchUrl);

            // Rate limit guard
            if (resp.remaining <= 2) {
                const waitMs = Math.max(0, (resp.reset * 1000) - Date.now()) + 2000;
                console.log(`\n⏳  Rate limit low — waiting ${Math.ceil(waitMs / 1000)}s…`);
                await sleep(waitMs);
            }

            if (resp.status === 429) {
                console.log('RATE LIMITED — retrying in 60s…');
                await sleep(60000);
                i--; // retry same item
                continue;
            }

            if (resp.status !== 200) {
                console.log(`API error ${resp.status}`);
                failed++;
                continue;
            }

            const photos = JSON.parse(resp.body).photos || [];

            // Pick first photo whose ID hasn't been used yet
            const photo = photos.find(p => !usedPhotoIds.has(p.id));

            if (!photo) {
                console.log('no unique photo found');
                failed++;
                await sleep(400);
                continue;
            }

            usedPhotoIds.add(photo.id);

            // Download to local file — format: StateName_itemId.jpg
            const safeName = stateName.replace(/\s+/g, '_');
            const filename = `${safeName}_${item.id}.jpg`;
            const dest     = path.join(OUTPUT_DIR, filename);
            await downloadFile(photo.src.medium, dest);

            const relativePath = `images/${filename}`;
            mapping[item.id]   = relativePath;
            downloaded++;

            console.log(`✅  ${filename}`);

        } catch (err) {
            console.log(`❌  ${err.message}`);
            failed++;
        }

        // Polite delay: ~1.5 requests/second (Pexels allows 200/hour)
        await sleep(450);
    }

    // ── Patch JSON files ──────────────────────────────────────────────────────
    console.log('\n\n🔧  Patching JSON data files…\n');
    let patchedFiles = 0;

    Object.entries(parsedFiles).forEach(([file, parsed]) => {
        let changed = false;
        const states = parsed.states || {};

        Object.values(states).forEach(stateData => {
            (stateData.sections || []).forEach(section => {
                (section.items || []).forEach(item => {
                    if (mapping[item.id]) {
                        item.image = mapping[item.id];
                        changed = true;
                    }
                });
            });
        });

        if (changed) {
            fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(parsed, null, 4));
            console.log(`  ✅  Updated: ${file}`);
            patchedFiles++;
        }
    });

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(52));
    console.log(`  ✅  Downloaded  : ${downloaded} images`);
    console.log(`  📝  Patched     : ${patchedFiles} JSON files`);
    console.log(`  ❌  Failed      : ${failed} items`);
    console.log(`  📁  Saved to    : images/`);
    console.log('═'.repeat(52) + '\n');
}

main().catch(err => {
    console.error('\n❌  Fatal error:', err.message);
    process.exit(1);
});
