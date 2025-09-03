import React from "react";
import { CampaignGuide } from "../types";

interface SimpleGuideSelectorProps {
  campaignGuides: CampaignGuide[];
  activeGuideId: string;
  onSelectGuide: (guideId: string) => void;
}

export const SimpleGuideSelector: React.FC<SimpleGuideSelectorProps> = ({
  campaignGuides,
  activeGuideId,
  onSelectGuide,
}) => {
  return (
    <div className="simple-guide-selector">
      <label className="guide-selector-label">Campaign Guide:</label>
      <select 
        className="guide-selector-dropdown"
        value={activeGuideId}
        onChange={(e) => onSelectGuide(e.target.value)}
      >
        {campaignGuides.map(guide => (
          <option key={guide.id} value={guide.id}>
{guide.name} {guide.custom ? '(Custom)' : ''} {guide.author ? ` • by ${guide.author}` : ''}
          </option>
        ))}
      </select>
    </div>
  );
};