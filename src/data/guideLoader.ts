import { CampaignGuide } from "../types";

// Dynamically import all guide JSON files from the guides directory
const guideModules = import.meta.glob('./guides/*.json', { eager: true });

// Extract the guide objects from the imported modules
const guideFiles = Object.values(guideModules).map(module => (module as any).default) as CampaignGuide[];

export const availableCampaignGuides: CampaignGuide[] = guideFiles;

export const defaultCampaignGuide: CampaignGuide = guideFiles.find(g => g.isDefault) || guideFiles[0];

// For backward compatibility - use the standard guide's acts as default quest data
export const defaultQuestData = defaultCampaignGuide.acts;