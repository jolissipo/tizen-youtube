import { GRID, SHELF, TILES, onTile, findResolver } from '../../framework/index.js';

// Only titles and public YouTube video IDs; never cookies, history or account tokens.
const VALID = /^[A-Za-z0-9_-]{11}$/;
const cache = [];
const state = { timer: null };

const titleOf = (tile) => {
    const title = tile.metadata?.tileMetadataRenderer?.title;
    return title?.simpleText || title?.runs?.map((r) => r.text || '').join('') || '';
};

const submit = () => {
    state.timer = null;
    if (!cache.length) return;
    try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/__tube/smart-hub/feed', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({ videos: cache }));
    } catch (error) { console.warn('[smart-hub] feed unavailable', error); }
};

const capture = (item) => {
    if (/^#?\/?search/i.test(String(location.hash || '').replace(/^#/, ''))) return;
    const tile = item.tileRenderer;
    if (!tile || tile.tvhtml5ShelfRendererType === 'TVHTML5_TILE_RENDERER_TYPE_SHORTS') return;
    const id = tile.onSelectCommand?.watchEndpoint?.videoId;
    const title = titleOf(tile).trim();
    if (!VALID.test(String(id)) || !title || cache.some((one) => one.videoId === id)) return;
    cache.push({ videoId: id, title: title.slice(0, 140) });
    if (cache.length > 12) cache.shift();
    if (state.timer === null) state.timer = setTimeout(submit, 1500);
};
onTile('smart hub preview', [SHELF, GRID, TILES], capture);

const actionId = (requested) => {
    const entries = requested?.appControl?.data || [];
    return entries.filter((entry) => entry.key === 'PAYLOAD').map((entry) => {
        try {
            const data = JSON.parse(entry.value[0]);
            const inner = typeof data.values === 'string' ? JSON.parse(data.values) : data;
            return VALID.test(String(inner.videoId || '')) ? inner.videoId : null;
        } catch (error) { return null; }
    }).filter(Boolean)[0] || null;
};

const openVideo = (id, attempt = 0) => {
    const resolver = findResolver();
    if (resolver && typeof resolver.resolveCommand === 'function') {
        try { resolver.resolveCommand({ watchEndpoint: { videoId: id } }); return; }
        catch (error) { console.warn('[smart-hub] cannot resolve video', error); }
    }
    if (attempt < 40) setTimeout(() => openVideo(id, attempt + 1), 400);
};

const handleControl = () => {
    // Cobalt may not expose Tizen APIs; never block normal YouTube startup if unavailable.
    if (typeof tizen === 'undefined' || !tizen.application) return;
    try {
        const requested = tizen.application.getCurrentApplication().getRequestedAppControl();
        const id = actionId(requested);
        if (id) openVideo(id);
    } catch (error) { console.warn('[smart-hub] appcontrol unavailable', error); }
};

if (typeof window !== 'undefined') {
    window.addEventListener('appcontrol', handleControl);
    setTimeout(handleControl, 0);
}
