# Smart Hub Preview — experimental fork

This fork adds a **16:9 Tizen launcher icon** and a personal Smart Hub preview feed to SushyDev/tizen-youtube (GPL-3.0-only).

## Icon

`npm run build` creates `dist/icon-oblong.png` (1920 × 1080) from the square `app/icon.png`. The PNG encoder uses only Node built-ins. `npm run package` includes this rectangular image as the package's root `icon.png` for both Tizen variants. The original source icon remains unchanged.

## Preview data flow

1. `mods/smartHub/index.js` collects the ID and title of at most 12 videos presented in YouTube's feed.
2. These are posted to the local `/__tube/smart-hub/feed` route of TubeService.
3. `service/lib/smartHub.js` validates and writes `smartHub.json` inside the app's shared directory.
4. A second `TubePreview` service invokes `webapis.preview.setPreviewData` and then exits. The main Cobalt proxy service remains active.
5. The preview service can also be started by Tizen when the system requests a refresh.

The launcher uses one **YouTube** section, not fake playback progress or a claimed `Continue Watching` history feed. Only public video IDs and titles are stored; no credentials are captured.

## Limitations to verify on the television

- Whether Smart Hub recognises this sideloaded Tizen app's second service and renders previews.
- Whether `tizen.application` / `appcontrol` are exposed inside Cobalt for a preview's **deep link** to resolve. The click handler is best-effort; it must not interrupt standard startup.
- The launcher may apply its own crop, background, or icon mask to the 16:9 image.
- The update interval is at least 10 minutes, consistent with Samsung's stated requirement.

Test by installing the unsigned WGT through Tizen Homebrew with device-specific signing, opening YouTube and browsing its homepage, pinning it in Smart Hub, then checking the preview and pressing a video. On failure, inspect the TubeService logs and the Samsung preview service logs. Do not treat an emulator-only pass as a real TV confirmation.

Samsung reference: https://developer.samsung.com/smarttv/develop/guides/smart-hub-preview/implementing-personal-preview.html
Jellyfin implementation: https://github.com/jellyfin/jellyfin-tizen/pull/319
