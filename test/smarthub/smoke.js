'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '../..');

const source = fs.readFileSync(path.join(ROOT, 'service/lib/smartHub.js'), 'utf8');
const service = { exports: {} };
const stub = (id) => {
    if (id === './clients.js') return { fromThisTv: () => true };
    if (id === './postmortem.js') return { note: () => {} };
    return require(id);
};
vm.runInNewContext('(function(require, module, process) {' + source + '\n})', {
    console, Buffer, Date
})(stub, service, process);
const feed = service.exports.format({ videos: [
    { videoId: 'dQw4w9WgXcQ', title: 'First' },
    { videoId: 'dQw4w9WgXcQ', title: 'Duplicate' },
    { videoId: '../../passwd', title: 'Unsafe' },
    { videoId: 'aqz-KE-bpKQ', title: 'Second' }
] });
assert(feed && feed.sections.length === 1);
assert.strictEqual(feed.sections[0].tiles.length, 2);
assert.strictEqual(feed.sections[0].tiles[0].image_ratio, '4by3');
assert.strictEqual(feed.sections[0].tiles[0].action_data, JSON.stringify({ videoId: 'dQw4w9WgXcQ' }));
assert.strictEqual(service.exports.format({ videos: [] }), null);

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'tube-preview-'));
try {
    const worker = fs.readFileSync(path.join(ROOT, 'service/preview.js'), 'utf8');
    const result = { exits: 0, data: null };
    const context = {
        require, console, module: { exports: {} },
        process: { env: { TUBE_SHARE: temporary } },
        tizen: { application: { getCurrentApplication: () => ({ exit: () => { result.exits += 1; } }) } },
        webapis: { preview: { setPreviewData: (data, done) => { result.data = JSON.parse(data); done(); } } }
    };
    vm.runInNewContext(worker, context);
    context.module.exports.onRequest();
    assert.strictEqual(result.exits, 1);
    fs.writeFileSync(path.join(temporary, 'smartHub.json'), JSON.stringify(feed));
    context.module = { exports: {} };
    vm.runInNewContext(worker, context);
    context.module.exports.onRequest();
    assert.strictEqual(result.exits, 2);
    assert.strictEqual(result.data.sections[0].tiles.length, 2);
} finally {
    fs.rmSync(temporary, { recursive: true, force: true });
}

const icon = fs.readFileSync(path.join(ROOT, 'app/icon-oblong.png'));
assert.strictEqual(icon.toString('hex', 0, 8), '89504e470d0a1a0a');
assert.strictEqual(icon.readUInt32BE(16), 1920);
assert.strictEqual(icon.readUInt32BE(20), 1080);
assert.strictEqual(crypto.createHash('sha256').update(icon).digest('hex'), '2b73db3b69eb072549814648a27982c1137642c641e04aa38e8ed86ce5b67dcd');

console.log('3/3 checks passed');
