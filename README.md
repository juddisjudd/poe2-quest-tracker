# Exile Compass

A desktop overlay application for tracking quests, gems, storing regex filters, and notes in Path of Exile 2.

[![GitHub Downloads (all assets, latest release)](https://img.shields.io/github/downloads/juddisjudd/poe2-quest-tracker/latest/total)](https://github.com/juddisjudd/poe2-quest-tracker/releases) [![GitHub Release](https://img.shields.io/github/v/release/juddisjudd/poe2-quest-tracker)](https://github.com/juddisjudd/poe2-quest-tracker/releases)


https://github.com/user-attachments/assets/94a43925-20e8-4eb1-88fd-7cd2393f3d73

## Features

### Quest Tracking
- 🎯 **Detailed Quest Information** - Complete reward descriptions, warnings, and strategic advice
- 📁 **Collapsible Acts** - Organize quests by act with expandable/collapsible sections
- 👁️ **Optional Quest Toggle** - Show/hide optional quests
- 📚 **Community Guides** - Easy contribution system for community-created guides

### Gem Progression
- Import gem builds directly from POB codes or pobb.in links
- Track acquired gems with visual indicators
- View gems organized by socket groups with main and support gems
- See completion progress for your build

### Regex Filters
- Store your various regex patterns
- One-click copying of regex patterns for in-game use

### Notes System
- 📝 **Manual Notes** - Create and edit your own notes
- 🔄 **POB Notes Import** - Automatically import notes from Path of Building codes
- 📂 **Dual Note Types** - Separate user notes and imported POB notes

### Customization & Settings
- ⚙️ **Multiple Themes**
- 🎚️ **Adjustable Opacity**
- 🔤 **Font Scaling**
- ⌨️ **Global Hotkeys** - Configurable show/hide hotkey (desktop only)
- 🖥️ **Overlay Mode**
- 💾 **Persistent State** - All progress and settings automatically saved

## Usage

### Basic Quest Tracking
1. Start the application
2. Use the checkboxes to mark quests as completed
3. Click on act headers to expand/collapse quest lists
4. Toggle optional quests visibility in settings

### Importing Gem Builds
1. Click the settings gear icon
2. Paste your Path of Building code or pobb.in link in the "Import Gems" section
3. Click "Import PoB" to load your gem progression
4. Use the GEMS button to view and track your imported build
5. Click on gem slots to mark them as acquired

### Selecting Campaign Guides
1. Use the guide selector dropdown in the top-right to choose your preferred campaign guide
2. Guides include author information and detailed quest progression
3. Community contributors can easily add new guides by submitting JSON files

### Using Regex Filters
1. Click the REGEX button at the bottom
2. Enter regex patterns for different item categories
3. Use the copy buttons to copy patterns to clipboard

### Managing Notes
1. Click the NOTES button at the bottom
2. Add manual notes in the user notes section
3. POB notes are automatically imported when using POB codes with notes
4. Clear POB notes separately from user notes if needed

### Customization
1. Access settings via the gear icon in the header
2. Choose from multiple themes (AMOLED variants)
3. Adjust opacity and font size for optimal overlay experience
4. Set global hotkey for quick show/hide (desktop version)
5. All settings and progress are automatically saved

### Community Guide System
Contributors can easily add new campaign guides by:
1. Creating a JSON file following the guide format
2. Adding it to `src/data/guides/`
3. Submitting a pull request
4. The guide will automatically appear in the dropdown after merging

Each quest entry includes:
- Quest name, giver, and location details
- Complete reward descriptions with strategic value
- Completion tracking with persistent state
- Optional/main quest classification
- Author attribution for community guides

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Note**: This is a community tool and is not affiliated with or endorsed by Grinding Gear Games.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/ohitsjudd)
