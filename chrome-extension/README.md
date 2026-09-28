# InsightUI DOM Scraper Extension

Chrome extension (Manifest V3) that captures full-page interface snapshots:

- `html`: `document.documentElement.outerHTML`
- `stylesheets`: accessible CSS rules from `document.styleSheets`
- `nodes`: DOM nodes with metadata (selector, attributes, bounds, style subset)

## What It Does

- Auto-captures on page load (`document_idle`) when auto-capture is enabled
- Supports manual capture via popup (`Scrape now`)
- Stores latest snapshot per tab in extension storage
- Exports snapshot JSON via popup (`Download JSON`)
- Opens InsightUI and pre-fills scraped page data (`Open InsightUI + Prefill`)

## Install (Developer Mode)

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this folder: `chrome-extension/`

## Usage

1. Open a target website tab
2. Click the extension icon
3. Use:
   - **Scrape now** to capture instantly
   - **Download JSON** to save latest snapshot for that tab
   - **Open InsightUI + Prefill** to open your InsightUI app with scraped HTML/CSS/DOM prefilled
   - **Auto-capture on page load** toggle to control automatic scraping
   - **InsightUI URL** to point at your running app (default `http://localhost:3000`)

## Notes and Limitations

- Cross-origin stylesheets may be inaccessible due to browser security/CORS. These are reported with `accessible: false`.
- Restricted pages (`chrome://`, extension pages, Web Store) cannot be scraped.
- Snapshot size can be large on complex pages.

## File Structure

- `manifest.json`
- `background.js`
- `content.js`
- `popup.html`
- `popup.css`
- `popup.js`
