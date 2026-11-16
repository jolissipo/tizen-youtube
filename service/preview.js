'use strict';

// This separate Node service publishes Smart Hub data then exits, unlike the permanent TubeService.
// It is deliberately ES5 so the Tizen 5.0 widget can execute it without Babel.
var fs = require('fs');
var path = require('path');
var FILE = path.join(process.env.TUBE_SHARE || '/home/owner/share/tube', 'smartHub.json');
var busy = false;

function finish() {
    try { tizen.application.getCurrentApplication().exit(); }
    catch (error) { console.error('[smart-hub] exit: ' + error.message); }
}

function publish() {
    if (busy) return;
    busy = true;
    var content;
    try {
        content = fs.readFileSync(FILE, 'utf8');
        var data = JSON.parse(content);
        if (!data || !Array.isArray(data.sections) || !data.sections.length) return finish();
    } catch (error) {
        console.log('[smart-hub] no saved feed: ' + error.message);
        return finish();
    }

    if (typeof webapis === 'undefined' || !webapis.preview) {
        console.error('[smart-hub] Preview API unavailable');
        return finish();
    }
    try {
        webapis.preview.setPreviewData(content,
            function () { console.log('[smart-hub] preview updated'); finish(); },
            function (error) { console.error('[smart-hub] update failed: ' + error.message); finish(); });
    } catch (error) {
        console.error('[smart-hub] update exception: ' + error.message);
        finish();
    }
}
module.exports.onStart = function () {};
module.exports.onRequest = publish;
module.exports.onStop = function () {};
module.exports.onExit = function () {};
