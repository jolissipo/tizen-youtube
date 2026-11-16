# Tube for Tizen — Smart Hub fork

<p align="center">
  <img src="app/icon-oblong.png" alt="Tube for Tizen 16:9 launcher artwork" width="420">
</p>

A fork of [SushyDev/tizen-youtube](https://github.com/SushyDev/tizen-youtube), an ad-free YouTube client for Samsung Tizen TVs that uses Samsung's native Cobalt engine.

This fork keeps the original player's features and adds **Samsung Smart Hub Preview** integration and a **fixed 16:9 launcher icon**.

## What's different

- **Smart Hub Preview:** a row of up to 12 YouTube videos from the app's feed, with titles, thumbnails and supported deep links. The preview is published by a dedicated Tizen service; the existing Cobalt proxy service stays active.
- **Oblong icon:** the approved 1920 × 1080 PNG is stored at `app/icon-oblong.png`. Both WGT packages include it as `icon.png`, without stretching or regeneration. Packaging verifies that the bytes match the committed image.
- **Checks:** tests cover the preview data, its background service and the icon inside both packaged widgets.

There are no changes to the upstream ad blocking, playback engine or player configuration.

## Compatibility and testing

| Package | Minimum Tizen version | Status |
| --- | --- | --- |
| `tube-tizen-5.0.wgt` | Tizen 5.0 | **Tested successfully on Samsung UE50RU7105KXXC (2019, Tizen 5.0)**, including Smart Hub Preview and the 16:9 launcher icon. |
| `tube-tizen-5.5.wgt` | Tizen 5.5 | **Build and automated checks only.** Not tested on a real TV. |

Smart Hub presentation can vary by TV and firmware. One successful device test does not establish compatibility with every Samsung model.

## Download and install

Get the two unsigned WGTs from [Releases](https://github.com/jolissipo/tizen-youtube/releases). Choose the build for your Tizen version. **Only install one variant.**

The WGTs are unsigned and require device-specific signing. There are two installation methods:

- **[Apps2Samsung](https://github.com/Apps2Samsung/Apps2Samsung):** install the downloaded WGT using a **Samsung Partner certificate** issued for your TV, rather than a Public certificate.
- **[Tizen Homebrew](https://github.com/SushyDev/tizen-homebrew):** use the project's device-specific signing and installation procedure.

**Note:** this fork retains the upstream app's package/application identifiers. Installing it may replace an existing installation of the original app. Keep a way to reinstall that version if necessary.

## Build from source

Requires Node.js 20 or newer.

```sh
git clone https://github.com/jolissipo/tizen-youtube.git
cd tizen-youtube
npm ci
npm run package
node tools/check-icon.js release/tube-tizen-5.5.wgt release/tube-tizen-5.0.wgt
```

The unsigned packages are written to `release/`. Run `npm test` for the project's automated test suites. See [the upstream development guide](docs/DEVELOP.md) for the other development commands.

## Credits and support

**Original project:** [SushyDev/tizen-youtube](https://github.com/SushyDev/tizen-youtube). All original functionality and upstream acknowledgements belong to its authors and contributors.

**Original author's Discord:** [SushyDev's community](https://discord.gg/WjxVnrsV4A). **This Discord is maintained by the original project author, not by the maintainer of this fork.** Questions about this fork's Smart Hub changes should be raised in [this repository's Issues](https://github.com/jolissipo/tizen-youtube/issues), rather than assuming the upstream community supports these modifications.

Smart Hub implementation references: [Samsung Smart Hub Preview documentation](https://developer.samsung.com/smarttv/develop/guides/smart-hub-preview/smart-hub-preview.html) and the [Jellyfin Tizen implementation](https://github.com/jellyfin/jellyfin-tizen/pull/319).

Licensed under **GPL-3.0-only**, as in the upstream project. See [LICENSE](LICENSE). This fork is not affiliated with YouTube, Google or Samsung.
