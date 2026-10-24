# Publishing Machine Stories

Repository: https://github.com/bblevick/machine-stories
Verified Pages URL: https://bblevick.github.io/machine-stories/

The `Verify and publish` workflow checks the code, installs Chromium/WebKit, runs browser tests, and builds with `BASE_PATH=/machine-stories/`. Pull requests verify without deploying. Pushes to main or manual workflow dispatch deploy after verification. Repository Pages settings must select **GitHub Actions** as the source.

For a local deployment-path check:

```sh
BASE_PATH=/machine-stories/ npm run build
BASE_PATH=/machine-stories/ npm run preview
```

Open the printed preview origin followed by `/machine-stories/`. Repositories contain original public portfolio code and redistributable assets. Keep environment files, credentials, raw test captures, and build output out of Git.

Profile pins are managed through GitHub’s profile UI. Publishing and pinning are separate actions; verify both instead of inferring pins from repository creation.

Published October 24, 2026. [First successful verification and deployment](https://github.com/bblevick/machine-stories/actions/runs/40144616619). The public demo passed actual browser interactions with no page errors, failed requests or external application requests; see `public-release-check.json`. All five repositories were pinned on the profile, with Tiny City Lab first.
