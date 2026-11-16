'use strict';

// Local interchange between Cobalt's visible YouTube feed and Samsung's preview service.
const fs = require('fs');
const path = require('path');
const { fromThisTv } = require('./clients.js');
const postmortem = require('./postmortem.js');

const FILE = path.join(process.env.TUBE_SHARE || '/home/owner/share/tube', 'smartHub.json');
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const state = { lastLaunch: 0 };
const MIN_INTERVAL = 10 * 60 * 1000;

const format = (body) => {
    if (!body || !Array.isArray(body.videos)) return null;
    const used = Object.create(null);
    const tiles = [];
    body.videos.slice(0, 40).forEach((entry) => {
        if (!entry || typeof entry !== 'object' || tiles.length >= 12) return;
        const videoId = String(entry.videoId || '');
        const title = String(entry.title || '').trim().slice(0, 140);
        if (!VIDEO_ID.test(videoId) || !title || used[videoId]) return;
        used[videoId] = true;
        tiles.push({
            title,
            image_ratio: '4by3',
            image_url: 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg',
            action_data: JSON.stringify({ videoId }),
            is_playable: true
        });
    });
    return tiles.length ? { sections: [{ title: 'YouTube', tiles }] } : null;
};

const save = (feed) => {
    try {
        fs.mkdirSync(path.dirname(FILE), { recursive: true });
        const temp = FILE + '.' + process.pid;
        fs.writeFileSync(temp, JSON.stringify(feed));
        fs.renameSync(temp, FILE);
        return true;
    } catch (error) {
        postmortem.note('smart-hub', 'save failed: ' + error.message);
        return false;
    }
};

const wakePreview = () => {
    if (typeof tizen === 'undefined' || !tizen.application) return;
    const now = Date.now();
    if (now - state.lastLaunch < MIN_INTERVAL) return;
    state.lastLaunch = now;
    try {
        const id = tizen.application.getCurrentApplication().appInfo.packageId + '.TubePreview';
        const request = new tizen.ApplicationControl(
            'http://tizen.org/appcontrol/operation/pick', null, 'image/jpeg', null,
            [new tizen.ApplicationControlData('Preview', ['refresh'])]
        );
        tizen.application.launchAppControl(request, id, () => {},
            (error) => postmortem.note('smart-hub', 'launch failed: ' + error.message));
    } catch (error) {
        postmortem.note('smart-hub', 'launch exception: ' + error.message);
    }
};

const parseBody = (text) => { try { return JSON.parse(text); } catch (error) { return null; } };

const attach = (app) => {
    app.post('/__tube/smart-hub/feed', (req, res) => {
        if (!fromThisTv(req)) return res.status(403).end();
        const chunks = [];
        const received = { size: 0, tooLarge: false };
        req.on('data', (chunk) => {
            received.size += chunk.length;
            if (received.size > 16000) {
                received.tooLarge = true;
                return req.destroy();
            }
            chunks.push(chunk);
        });
        req.on('end', () => {
            if (received.tooLarge) return;
            const text = Buffer.concat(chunks).toString('utf8');
            const parsed = parseBody(text);
            if (!parsed) return res.status(400).end();
            const feed = format(parsed);
            if (!feed) return res.status(422).end();
            if (!save(feed)) return res.status(500).end();
            res.status(204).end();
            wakePreview();
        });
    });
};

module.exports = { attach, format, FILE };
