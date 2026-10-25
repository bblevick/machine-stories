# Afterthought v2 verification — October 24, 2026

M4 Mac, 24 GB RAM, Node 24.22.1. Six model cases, five local HTTP bridge contract cases and twelve Chromium/WebKit browser scenarios passed. Covered persistence, invalid imports, note edits/undo, diagram connections/export, actual mouse ink/eraser/undo, responsive forms, synthetic pressure values, disconnected setup, and receipt-based response dedup/reload using explicitly labeled API fixtures.

The actual Node bridge is running at 127.0.0.1:8766 without credentials and returns `connected:false, configured:false`; this is expected for a fresh machine. Hermes is not installed/configured, so no model/tool run or agent task outcome is claimed. Install/configure Hermes and follow README to perform that separate live check. Physical iPad/Apple Pencil hardware remains untested; desktop WebKit and synthetic pen events do not establish native hardware quality.

Current screenshots: overview.png, diagram.png, whiteboard.png. Current 50-second video records the real notebook interface and disconnected setup guide, with no fabricated agent reply. Repository-base and public Pages smoke checks are stored separately in JSON. Earlier exhibit evidence remains in Git history; its performance numbers do not apply to this application.

A fresh Git clone passed npm ci, type/model/bridge checks, all twelve browser checks and the production repository-path build. The real local Vite proxy returned the actual disconnected bridge state with credentials omitted from evidence. The first public Afterthought deployment passed notebook persistence, diagram creation and actual mouse ink with no page errors, HTTP failures or external application requests.
