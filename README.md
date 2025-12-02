# Exile Compass

A desktop overlay companion app for Path of Exile 2. Track quests, follow your gem progression, view your passive tree, create regex filters, and keep notes - all in one place.

[![GitHub Downloads (all assets, latest release)](https://img.shields.io/github/downloads/juddisjudd/poe2-quest-tracker/latest/total)](https://github.com/juddisjudd/poe2-quest-tracker/releases) [![GitHub Release](https://img.shields.io/github/v/release/juddisjudd/poe2-quest-tracker)](https://github.com/juddisjudd/poe2-quest-tracker/releases)

## Download

Get the latest release from the [Releases page](https://github.com/juddisjudd/poe2-quest-tracker/releases).

- **Windows**: Download the `.exe` installer
- **Linux**: Download the `.AppImage` or `.deb` package

## Features

### Quest Tracking
- Detailed quest information with rewards, warnings, and strategic advice
- Quests organized by act with collapsible sections
- Toggle optional quests on or off
- Multiple community-created campaign guides to choose from

### Gem Progression
- Import gem builds directly from Path of Building codes or pobb.in links
- Track which gems you've acquired with visual progress indicators
- View gems organized by socket groups with main and support gems clearly labeled
- Support for multiple loadouts from your POB build

### Passive Tree Viewer
- View your imported passive tree in a dedicated window
- See allocated nodes with full skill icons
- Switch between loadouts to compare different tree configurations
- Hover over nodes to see detailed stat information

### Regex Creator
- Build custom regex search patterns for in-game item filtering
- One-click copy to clipboard for quick use

### Notes
- Create and edit your own notes
- Automatically import notes from Path of Building
- Keep POB notes and personal notes separate

### Customization
- Multiple themes including AMOLED dark variants
- Adjustable window opacity for overlay use
- Scalable font size
- Configurable global hotkey to show/hide the overlay
- All settings and progress saved automatically

## How to Use

### Getting Started
1. Download and install Exile Compass
2. Launch the application - it will appear as an overlay on your screen
3. Use the checkboxes to track quest completion as you play
4. Click act headers to expand or collapse quest lists

### Importing Your Build
1. Open Path of Building and copy your build code (or use a pobb.in link)
2. Click the settings icon in Exile Compass
3. Paste your code in the "Import Gems" section and click "Import PoB"
4. Your gem progression and passive tree will be loaded

### Viewing Your Passive Tree
1. After importing a POB build, click the "Tree" button
2. A separate window opens showing your allocated passive nodes
3. Use the mouse wheel to zoom and drag to pan around the tree
4. If your build has multiple loadouts, use the dropdown to switch between them

### Using the Regex Creator
1. Click the "Regex" button at the bottom of the overlay
2. Build your regex patterns for item filtering
3. Click the copy button to copy the pattern to your clipboard

### Choosing a Campaign Guide
Use the guide dropdown in the header to select from available community guides. Each guide provides quest-by-quest progression tailored to different playstyles.

## Contributing

Campaign guides can be contributed by creating a JSON file and submitting a pull request. See the existing guides in `src/data/guides/` for the format.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

This is a community tool and is not affiliated with or endorsed by Grinding Gear Games.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/ohitsjudd)
