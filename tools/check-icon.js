'use strict';

// Validate the committed oblong art and verify every packaged WGT preserves it exactly.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const JSZip = require('jszip');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'app/icon-oblong.png');

const icon = fs.readFileSync(SOURCE);
assert.strictEqual(icon.toString('hex', 0, 8), '89504e470d0a1a0a', 'icon must be PNG');
assert.strictEqual(icon.readUInt32BE(16), 1920, 'icon width must be 1920');
assert.strictEqual(icon.readUInt32BE(20), 1080, 'icon height must be 1080');
const digest = crypto.createHash('sha256').update(icon).digest('hex');
console.log('Static oblong: 1920x1080, sha256 ' + digest);

const inspect = async (filename) => {
    const zip = await JSZip.loadAsync(fs.readFileSync(filename));
    const entry = zip.file('icon.png');
    assert(entry, filename + ' has no root icon.png');
    const packaged = await entry.async('nodebuffer');
    assert(packaged.equals(icon), filename + ' does not preserve the static PNG bytes');
    const manifest = zip.file('config.xml');
    assert(manifest, filename + ' has no config.xml');
    const xml = await manifest.async('string');
    assert(/<icon\s+src="icon\.png"\s*\/>/.test(xml), filename + ' does not reference icon.png');
    console.log(path.basename(filename) + ': original PNG preserved byte-for-byte');
};

Promise.all(process.argv.slice(2).map(inspect)).catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
