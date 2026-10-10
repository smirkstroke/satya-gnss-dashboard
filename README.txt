SATYA-GNSS DASHBOARD PROTOTYPE
Beginner-friendly HTML + CSS + JavaScript demo

WHAT THIS IS
- A local dashboard prototype based on the Satya-GNSS V4 dossier.
- Uses synthetic values and predefined scenarios.
- Includes a Trust Score, four pillar cards, history bars, an event log, and a mock Safe Mode request.
- Uses no server, Python, packages, account, or internet connection after the files are downloaded.

IMPORTANT LIMITATIONS
- This is not connected to a GNSS receiver, ESP32, NOC, telecom tower, or real-time source.
- The scenario data and attack-like flags are simulated, not actual attack detection.
- The dossier calls the weights and confidence thresholds illustrative/unvalidated.
- The dashboard's mock Safe Mode button only records a local event. It cannot switch a real tower's time source.

HOW TO RUN ON WINDOWS
1. Download and extract satya_gnss_dashboard.zip.
2. Open the extracted folder named satya_gnss_dashboard.
3. Double-click index.html.
4. It should open in your default browser (Edge or Chrome).
5. Click Normal reception, Weak signal, Spoofing-like, Jamming-like, and Missing data to test the UI.
6. Click "Request Safe Mode (mock)" to add a local demo event.
7. Click "Clear log" to clear the event table and chart history.

IF DOUBLE-CLICK DOES NOT OPEN IT
1. Right-click index.html.
2. Choose Open with > Microsoft Edge or Google Chrome.

FILES
- index.html: dashboard layout and text.
- styles.css: colours, spacing, responsive layout.
- script.js: demo scenarios, score formula, rendering and event log.
- README.txt: these instructions.

HOW THE SCORE IS CALCULATED
Trust Score = round(100 × weighted pillar health × confidence factor)
Confidence factor = 0.5 + 0.5 × Qsat × Qdop
Qsat = min(1, satellites / 12)
Qdop = 1.0 when HDOP <= 2; 0.7 when HDOP <= 5; otherwise 0.4.
Pillar weights: 0.35, 0.20, 0.20, 0.25.
Unavailable pillars are represented as 0.5, as described in the dossier.
A fixed-location failure applies the dossier's draft cap of 59.
Score bands: 80-100 Trusted; 60-79 Watch; 40-59 Suspicious; 0-39 Critical.

FIRST CODE EDITS TO TRY
- Open script.js in Notepad or VS Code.
- Find the `scenarios` object near the top.
- Change a value such as `satellites: 18` or `hdop: 0.9`.
- Save the file, then refresh index.html in the browser.
- Keep a copy of the original files before making changes.

NEXT DEVELOPMENT STEPS
1. Review the exact pillar thresholds with your team.
2. Test the formula against the worked examples in the V4 dossier.
3. Add a real data-input interface only after the receiver output format is confirmed.
4. Connect a backend/mock NOC only after the standalone UI and score logic are reviewed.
5. Record test evidence and label features BUILT only after they are implemented and verified.
