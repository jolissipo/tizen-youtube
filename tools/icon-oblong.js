'use strict';

// Converts the original square art into a 1920x1080 PNG without a graphics dependency.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'app', 'icon.png');
const OUTPUT = path.join(ROOT, 'dist', 'icon-oblong.png');
const W = 1920;
const H = 1080;

const fail = (reason) => { throw new Error('oblong icon: ' + reason); };

const decode = (png) => {
    if (png.slice(0, 8).toString('hex') !== '89504e470d0a1a0a') fail('not a PNG');
    const state = { at: 8, width: 0, height: 0, channels: 0, chunks: [] };
    while (state.at + 12 <= png.length) {
        const size = png.readUInt32BE(state.at);
        const type = png.toString('ascii', state.at + 4, state.at + 8);
        const part = png.slice(state.at + 8, state.at + 8 + size);
        state.at += size + 12;
        if (type === 'IHDR') {
            state.width = part.readUInt32BE(0);
            state.height = part.readUInt32BE(4);
            state.channels = part[9] === 6 ? 4 : part[9] === 2 ? 3 : 0;
            if (part[8] !== 8 || !state.channels || part[12] !== 0) fail('8-bit RGB/RGBA PNG required');
        }
        if (type === 'IDAT') state.chunks.push(part);
        if (type === 'IEND') break;
    }
    const channels = state.channels;
    const stride = state.width * channels;
    const scan = zlib.inflateSync(Buffer.concat(state.chunks));
    const pixels = Buffer.alloc(stride * state.height);
    for (let y = 0, offset = 0; y < state.height; y += 1) {
        const filter = scan[offset++];
        for (let x = 0; x < stride; x += 1) {
            const value = scan[offset++];
            const left = x >= channels ? pixels[y * stride + x - channels] : 0;
            const above = y ? pixels[(y - 1) * stride + x] : 0;
            const corner = y && x >= channels ? pixels[(y - 1) * stride + x - channels] : 0;
            const paeth = () => {
                const estimate = left + above - corner;
                const a = Math.abs(estimate - left);
                const b = Math.abs(estimate - above);
                const c = Math.abs(estimate - corner);
                return a <= b && a <= c ? left : b <= c ? above : corner;
            };
            const predictor = filter === 0 ? 0 : filter === 1 ? left : filter === 2 ? above
                : filter === 3 ? Math.floor((left + above) / 2) : filter === 4 ? paeth()
                    : fail('unsupported PNG filter');
            pixels[y * stride + x] = (value + predictor) & 255;
        }
    }
    return { width: state.width, height: state.height, channels, pixels };
};

const sample = (source, x, y, channel) => {
    const px = Math.max(0, Math.min(source.width - 1, x));
    const py = Math.max(0, Math.min(source.height - 1, y));
    const x0 = Math.floor(px);
    const y0 = Math.floor(py);
    const x1 = Math.min(source.width - 1, x0 + 1);
    const y1 = Math.min(source.height - 1, y0 + 1);
    const dx = px - x0;
    const dy = py - y0;
    const at = (sx, sy) => source.pixels[(sy * source.width + sx) * source.channels + channel];
    return (at(x0, y0) * (1 - dx) + at(x1, y0) * dx) * (1 - dy)
        + (at(x0, y1) * (1 - dx) + at(x1, y1) * dx) * dy;
};

const CRC_TABLE = Array.from({ length: 256 }, (_, number) => {
    const state = { value: number };
    for (let i = 0; i < 8; i += 1) {
        state.value = state.value & 1 ? (0xedb88320 ^ (state.value >>> 1)) : state.value >>> 1;
    }
    return state.value >>> 0;
});
const crc32 = (content) => {
    const state = { value: 0xffffffff };
    content.forEach((byte) => { state.value = CRC_TABLE[(state.value ^ byte) & 255] ^ (state.value >>> 8); });
    return (state.value ^ 0xffffffff) >>> 0;
};
const chunk = (name, content) => {
    const label = Buffer.from(name, 'ascii');
    const size = Buffer.alloc(4);
    size.writeUInt32BE(content.length);
    const body = Buffer.concat([label, content]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([size, body, crc]);
};
const encode = (pixels, width, height) => {
    const stride = width * 3;
    const rows = Buffer.alloc((stride + 1) * height);
    for (let y = 0; y < height; y += 1) {
        pixels.copy(rows, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
    }
    const header = Buffer.alloc(13);
    header.writeUInt32BE(width, 0);
    header.writeUInt32BE(height, 4);
    header[8] = 8;
    header[9] = 2;
    return Buffer.concat([
        Buffer.from('89504e470d0a1a0a', 'hex'),
        chunk('IHDR', header),
        chunk('IDAT', zlib.deflateSync(rows, { level: 9 })),
        chunk('IEND', Buffer.alloc(0))
    ]);
};

const build = () => {
    const source = decode(fs.readFileSync(SOURCE));
    const margin = Math.floor((W - H) / 2);
    const rgb = Buffer.alloc(W * H * 3);
    for (let y = 0; y < H; y += 1) {
        const sy = (y + 0.5) * source.height / H - 0.5;
        for (let x = 0; x < W; x += 1) {
            // Extend the actual left and right edge pixels; preserve the centre image.
            const sx = x < margin ? 0 : x >= margin + H ? source.width - 1
                : (x - margin + 0.5) * source.width / H - 0.5;
            for (let channel = 0; channel < 3; channel += 1) {
                rgb[(y * W + x) * 3 + channel] = Math.round(sample(source, sx, sy, channel));
            }
        }
    }
    fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
    fs.writeFileSync(OUTPUT, encode(rgb, W, H));
    console.log('oblong icon: ' + W + 'x' + H + ' -> ' + OUTPUT);
};

build();
