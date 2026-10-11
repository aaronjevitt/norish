# 01 — Publish the Norish Obscura image

**What to build:** Establish the reproducible browser artifact that the Norish application and every supported deployment will use for rendered-page imports.

**Blocked by:** Nothing

**Status:** ready-for-human

- [x] Norish builds its Obscura image from one explicitly pinned upstream source revision rather than from a floating branch, tag, or upstream image. _(Adjusted: repackaged from upstream's `v0.2.0` render+stealth release archive, pinned by version, not built from source — see the comments below.)_
- [x] The image build enables Obscura's full stealth feature, and the shipped service always starts Obscura with stealth enabled.
- [x] The runtime command retains Obscura's private-network protection and exposes no supported switch that adds `--allow-private-network`.
- [ ] One immutable image version is published as a multi-architecture manifest with native Linux AMD64 and ARM64 variants.
- [x] Active release automation can rebuild and publish the pinned artifact without relying on undocumented workstation state.
- [x] The selected tag and source revision are recorded together so a release can prove which upstream source it contains. _(Adjusted: `pin.env` records the tag and the upstream **release**; the commit that release was cut from is no longer recorded — see the comments below.)_
- [x] Required Obscura licensing and attribution accompany the owned image and its build source.
- [ ] An application release cannot publish configuration that references the image until that immutable image version is available. _(Was met by `verify-pin.sh` gating both release workflows; that gate has been removed — see the comments below.)_
- [x] The artifact contract is validated through its build and manifest metadata; no Obscura behavior, anti-bot, or live-site compatibility suite is introduced.

## Comments

**2026-08-09 — one maintainer action outstanding: publish the image.** Everything
that builds and gates the artifact has landed (`docker/obscura/`, the pin,
`verify-pin.sh`, and the **Publish Obscura image** workflow), but
`norishapp/obscura:0.2.0-norish.1` is not on Docker Hub yet — pushing it needs
the `DOCKERHUB_*` secrets, so it has to be a maintainer running the workflow from
the Actions tab.

Order matters: `verify-pin.sh --registry` now gates `prepare-release` in both
`rc-release-build.yml` and `release-build.yml`, which is the point — a release
cannot ship Compose examples naming an image that does not exist. Until the
workflow has run once, **every RC and release build will stop at the "Obscura
pin" job**. Run it before merging to an `rc/**` branch.


**2026-08-10 — the from-source build was unnecessary; the image now repackages
upstream's release archive.** Obscura `v0.2.0` publishes four builds per
platform, and the `-stealth` suffix is exactly the render+stealth combination
this ticket asked for:

| Suffix | Rendering | Stealth |
| --- | --- | --- |
| (none) | yes | no |
| `-stealth` | yes | yes |
| `-no-render` | no | no |
| `-no-render-stealth` | no | yes |

So the Dockerfile no longer carries a Rust toolchain, cmake, clang or a
30-plus-minute compile. It fetches `obscura-<arch>-linux-stealth.tar.gz`, checks
it against a SHA-256 recorded in `pin.env`, and copies the two binaries into
`distroless/cc`.

Verified locally against the built image on 2026-08-10:

- `linux/arm64` image builds in seconds; the container starts and prints
  `Headless Browser v0.2.0` with its CDP server up.
- `playwright-core` 1.61.1 `connectOverCDP` → `newContext({extraHTTPHeaders})` →
  `goto(…, {waitUntil: "load"})` → `content()` → `close()` all work, which is
  precisely the contract `packages/api/src/parser/fetch.ts` depends on.
- Stealth is genuinely compiled in: 152 BoringSSL symbols in the binary.
- The SSRF guard is real and on by default: navigating to a loopback address is
  refused with `Access to private/internal IP address`.
- Runtime needs are `libc`, `libgcc_s`, `libm` and glibc ≤ 2.35;
  `distroless/cc-debian12` carries 2.36.


**2026-08-10 — the pin is the version, and the pin checker is gone.** Two rounds
of machinery came off, on the grounds that they cost more attention than the
risk they covered:

- **Archive digests and the upstream commit are out of `pin.env`.** The threat
  they answered — GitHub release assets can be replaced in place — is remote,
  and the price was four values to re-derive on every Obscura bump plus a
  drift check between `pin.env` and the Dockerfile. `pin.env` now holds the
  upstream release and the image tag; the Apache-2.0 `LICENSE` is fetched at
  the release tag rather than at a commit SHA.
- **`verify-pin.sh` and `tooling/github/verify-obscura-pin` are deleted**, along
  with the `obscura-pin` job in `rc-release-build.yml` and
  `release-build.yml`. Nothing now proves that the tag in the Compose examples
  is published before a release is tagged. That was criterion 8, now unchecked;
  the failure it prevented is an operator getting a "manifest unknown" on
  `docker compose pull`, which is loud and immediately fixable.

The script's third job — asserting the published manifest covers both
architectures — went with it, and criterion 4 has no dedicated check now. The
workflow's shape still carries it: `merge` needs both `build` jobs, and each
uploads its digest with `if-no-files-found: error`, so a single-architecture
manifest would need a build job to succeed having produced nothing. The
assembled manifest is printed in the publish log for a human to read.

**What did not change, and why: the image is still ours.** The obvious
simplification is to drop `docker/obscura/` and pull `h4ckf0r0day/obscura:0.2.0`
— upstream does publish an image. Re-measured on 2026-08-10, that image is still
the render-only build:

| | upstream image `0.2.0` | `…-linux-stealth.tar.gz` | `…-linux.tar.gz` |
| --- | --- | --- | --- |
| BoringSSL strings | 0 | 152 | — |
| `obscura` size (aarch64) | 92,751,800 | 99,849,984 | 92,667,840 |

Upstream's own v0.2.0 notes say the same in words: "the default archive and
Docker image include rendering" — stealth is not in it, and Docker Hub carries
no `-stealth` tag. Starting that image as `serve --stealth` prints the normal
banner and runs, so adopting it would drop stealth from every URL import with
nothing in the logs to say so. `norishapp/obscura` (created 2026-08-10, still
empty) is where our build goes. If upstream ever publishes a stealth image, this
directory should be deleted in favour of pulling theirs.

**Still outstanding, unchanged:** `norishapp/obscura:0.2.0-norish.1` has not
been published. It needs a maintainer with the `DOCKERHUB_*` secrets to run the
**Publish Obscura image** workflow from the Actions tab. Release builds no
longer block on it, so the first operator to follow the Quick Start is now what
catches it if it is forgotten.
