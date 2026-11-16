# Tube for Tizen — Smart Hub Preview

<p align="center">
  <img src="app/icon-oblong.png" alt="Tube for Tizen launcher icon" width="420">
</p>

A fork of [SushyDev/tizen-youtube](https://github.com/SushyDev/tizen-youtube) for Samsung Tizen TVs. It retains the upstream YouTube client and adds Smart Hub previews and a 16:9 launcher icon.

## Changes

- **Smart Hub Preview:** displays up to 12 videos from the YouTube feed, with thumbnails, titles and links to open them. A separate Tizen service updates the preview without replacing the existing Cobalt proxy.
- **16:9 icon:** uses a fixed 1920 × 1080 PNG (`app/icon-oblong.png`). Both WGT variants package the same image without resizing. The build checks its dimensions and file integrity.

## Compatibility

| Package | Tizen | Tested |
| --- | --- | --- |
| `tube-tizen-5.0.wgt` | 5.0+ | Samsung UE50RU7105KXXC (2019, Tizen 5.0): playback, Smart Hub previews and icon |
| `tube-tizen-5.5.wgt` | 5.5+ | Automated build and tests only; not tested on a TV |

Other TV models and firmware versions have not been verified for this fork.

## Installation

Download the appropriate unsigned WGT from [Releases](https://github.com/jolissipo/tizen-youtube/releases).

- **[Apps2Samsung](https://github.com/Apps2Samsung/Apps2Samsung):** install with a Samsung **Partner certificate** for your TV.
- **[Tizen Homebrew](https://github.com/SushyDev/tizen-homebrew):** follow its device-specific signing and installation instructions.

The application identifiers are inherited from the upstream project. Installing this fork may replace the original application.

## Build

Requires Node.js 20 or newer.

```sh
git clone https://github.com/jolissipo/tizen-youtube.git
cd tizen-youtube
npm ci
npm run package
node tools/check-icon.js release/tube-tizen-5.0.wgt release/tube-tizen-5.5.wgt
```

The unsigned WGTs are written to `release/`. See [DEVELOP.md](docs/DEVELOP.md) for development commands.

## Credits

Based on [SushyDev/tizen-youtube](https://github.com/SushyDev/tizen-youtube). The original project and its contributors retain credit for the upstream client.

[Discord — original project's community](https://discord.gg/WjxVnrsV4A) (run by SushyDev, **not** by this fork's maintainer). For fork-specific issues, use this repository's [Issues](https://github.com/jolissipo/tizen-youtube/issues).

Smart Hub references: [Samsung documentation](https://developer.samsung.com/smarttv/develop/guides/smart-hub-preview/implementing-personal-preview.html) and [Jellyfin Tizen PR #319](https://github.com/jellyfin/jellyfin-tizen/pull/319).

Licensed under [GPL-3.0-only](LICENSE), as in the upstream project.
