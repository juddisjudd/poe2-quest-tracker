# Campaign Guides

This directory contains JSON-formatted campaign guides for Path of Exile 2.

## Structure

Each guide file follows the `CampaignGuide` TypeScript interface:

```typescript
{
  "id": "unique-guide-id",
  "name": "Guide Display Name",
  "description": "Brief description of what this guide covers",
  "author": "Author Name",
  "version": "1.0",
  "isDefault": true/false,  // true for the recommended default guide
  "custom": false,          // false for official guides
  "acts": [
    {
      "id": "unique-act-id",
      "name": "Act Display Name", 
      "expanded": true/false,  // default expanded state
      "quests": [
        {
          "id": "unique-quest-id",
          "name": "Quest display name with **markdown** formatting",
          "description": "Quest description or notes",
          "reward": "Reward description (optional)",
          "warning": "Warning message (optional)", 
          "completed": false,
          "optional": false
        }
      ]
    }
  ]
}
```

## Available Guides

- **standard-guide.json** - Complete campaign guide with all essential quests and rewards
- **speedrun-guide.json** - Minimal speedrun-focused guide with only essential quests

## Contributing Community Guides

To contribute a new community guide:

1. Create a new JSON file following the structure above
2. Use a unique ID (e.g., `community-guide-name`)
3. Set `"custom": false` for community guides  
4. Set `"isDefault": false` (only one guide should be default)
5. Submit via GitHub Pull Request

The guides are automatically loaded at build time, so no code changes are needed to add new guides.

## Formatting

Quest names support **markdown bold** formatting for area names and boss names:
- `**[Area Name]** - Kill **Boss Name**`
- Use `**text**` for emphasis on important quest elements

Descriptions can include multi-line text with `\n\n` for paragraph breaks.