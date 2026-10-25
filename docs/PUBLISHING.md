# Publishing Afterthought

Repository: https://github.com/bblevick/machine-stories
Pages: https://bblevick.github.io/machine-stories/

The `Verify and publish` workflow runs type/model/HTTP-bridge/browser checks, then builds with `BASE_PATH=/machine-stories/` and deploys through GitHub Actions. The published site is the standalone notebook, diagram editor and whiteboard. The Node bridge and any credentials are not deployed. Live Hermes work is a separate local setup dependency.

To reproduce the repository path locally:

```sh
BASE_PATH=/machine-stories/ npm run build
BASE_PATH=/machine-stories/ npm run preview
```

Visit the preview origin followed by `/machine-stories/`. Production/public browser evidence files identify the checked version and explicitly record the unconfigured agent boundary. All five portfolio repositories remain pinned; Afterthought replaces the earlier exhibit at the existing Machine Stories URL.
