# Vendored cui-llama.rn — maintenance & llama.cpp upgrades

This directory is a **vendored, in-repo copy** of the `cui-llama.rn` native binding
(https://github.com/Vali-98/cui-llama.rn). ChatterUI consumes it through a local
`file:` dependency:

```jsonc
// package.json
"cui-llama.rn": "file:./vendor/cui-llama.rn"
```

`npm install` symlinks `node_modules/cui-llama.rn` -> `vendor/cui-llama.rn`, so the app
builds against this copy instead of the npm registry.

## What is bundled here

- `cpp/` — the llama.cpp + ggml sources (symbol-prefixed with `LM_`/`lm_`) plus the RN
  wrapper (`rn-llama.cpp`, `rn-completion.cpp`, `jsi/*`, ...). This is the actual llama.cpp
  that gets compiled into the app.
- `lib/` — prebuilt JS (the package entry point, `lib/commonjs/index.js`).
- `android/src/main/jniLibs/` and `bin/arm64-v8a/` — prebuilt Android `.so` libraries
  (CPU variants + Hexagon HTP + OpenCL).
- `ios/rnllama.xcframework` — prebuilt iOS/tvOS framework.
- `scripts/` — the upstream build/bootstrap tooling (overlaid from the binding's git repo)
  so llama.cpp can be re-synced in-repo. Not used at install time.

The bundled llama.cpp is current (it includes `flash_attn_type`, `top_n_sigma`,
`adaptive_*`, `reasoning_budget`, `llama_memory_t`, and the `NVFP4` / `MXFP4_MOE` ftypes).
By default the app uses the **prebuilt** native libraries above, which already match this
`cpp/`, so no native toolchain is required to build the app.

## Upgrading the bundled llama.cpp

The prebuilt libraries and `cpp/` are a matched set. If you bump llama.cpp you MUST also
rebuild the native libraries, otherwise `cpp/` and the shipped `.so`/`.xcframework` drift
apart. This requires a native toolchain (Android NDK and/or Xcode) and cannot be done by
editing TypeScript alone.

Procedure (run inside `vendor/cui-llama.rn`):

1. Provide the llama.cpp source as the submodule the bootstrap expects:
   ```bash
   git submodule add -b cui-llama.rn https://github.com/Vali-98/llama.cpp third_party/llama.cpp
   # or point third_party/llama.cpp at your own checkout / newer commit
   ```
   Note: bootstrap expects the `Vali-98/llama.cpp` fork (branch `cui-llama.rn`), which carries
   the mobile-specific patches (Hexagon, OpenCL, the `LM_` symbol renames). Re-bootstrapping
   against an unpatched upstream checkout will drop those and likely break the Android build.

2. Re-vendor the sources into `cpp/`:
   ```bash
   npm run bootstrap     # updates the submodule, copies sources to cpp/, applies scripts/patches/*
   ```

3. Rebuild the native libraries:
   ```bash
   npm run build:android-libs   # needs Android NDK; builds CPU + Hexagon HTP + OpenCL .so
   npm run build:ios-frameworks # needs Xcode (macOS); builds rnllama.xcframework
   npm run build                # rebuilds lib/ (bob build)
   ```

4. From the ChatterUI root, reinstall and rebuild the app:
   ```bash
   npm install
   npm run prebuild        # expo prebuild --clean
   npm run dev:android     # or dev:ios
   ```

## Notes

- The large prebuilt binaries (`.so`, `.xcframework`) make this directory ~170 MB. Consider
  tracking them with Git LFS (e.g. add `vendor/cui-llama.rn/**/*.so` and
  `vendor/cui-llama.rn/ios/**` to `.gitattributes`).
- ChatterUI's Expo config plugins reference this module by the package name and by the path
  `node_modules/cui-llama.rn/bin/arm64-v8a` (see `expo-build-plugins/copyhtp.plugin.js` and
  `rnllama.plugin.js`); both keep working through the `file:` symlink.
- The very newest upstream `Q1_0` ftype is not in this bundled llama.cpp yet. ChatterUI labels
  it for display (`lib/engine/Local/GGML.ts`), but loading a `Q1_0` model requires bumping the
  bundled llama.cpp per the procedure above.
