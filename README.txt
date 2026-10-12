SATYA-GNSS DASHBOARD PROTOTYPE — UI REFRESH (BUILD 02)

CONTENTS
- index.html: dashboard structure
- styles.css: styling and responsive UI
- script.js: demo scenario behavior

RUN LOCALLY
1. Extract this folder.
2. Double-click index.html to open it in a modern browser.
3. Use the scenario buttons to explore the synthetic examples.

UPDATE YOUR EXISTING GITHUB REPOSITORY
1. Download and extract this ZIP.
2. Open your existing local satya-gnss-dashboard repository folder (the one GitHub Desktop manages).
3. Copy index.html, styles.css, script.js, and README.txt from this folder into that repository folder.
4. If Windows asks whether to replace the existing files, choose Replace the files in the destination.
5. Open GitHub Desktop. Review the four changed files.
6. Enter a commit summary such as: Refresh dashboard UI build 02
7. Click Commit to main.
8. Click Push origin (or the available Publish/Push button) to upload the commit.
9. After the push succeeds, wait a minute and refresh the live GitHub Pages site. Use Ctrl+F5 for a hard refresh.

IMPORTANT LIMITATIONS
- This is a front-end prototype. It does not connect to a real GNSS receiver, ESP32, network operations centre, or tower equipment.
- All satellite counts, HDOP, trust scores, and scenario flags are simulated examples.
- The V4 weights and thresholds are illustrative and not validated measurements.
- The Safe Mode control records a local mock event only; it does not control external equipment.
