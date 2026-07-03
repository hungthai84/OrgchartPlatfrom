/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RelationshipType = 'champion' | 'supporter' | 'neutral' | 'detractor' | 'blocker';
export type InfluenceLevel = 'high' | 'medium' | 'low' | 'none';

export interface CustomFieldDefinition {
  id: string;
  label: string;
  type: 'text' | 'select' | 'number';
  options?: string[]; // for 'select' type
}

export interface ChartSettings {
  chartName: string;
  chartDescription: string;
  layoutDirection: 'TB' | 'LR'; // Top-to-Bottom or Left-to-Right
  cardSize: 'compact' | 'detailed';
  showRelationshipColors: boolean;
  showAvatars: boolean;
  primaryField: string; // e.g., 'name'
  secondaryField: string; // e.g., 'title'
  tertiaryField: string; // e.g., 'department'
  visibleFields: string[]; // List of field keys to show
  customFieldDefinitions: CustomFieldDefinition[];
  themeColor: string; // Hex color or Tailwind name
  backgroundType?: 'grid' | 'white' | 'image' | 'video' | 'gradient' | 'pattern';
  companyLogoUrl?: string;
  cardTransparency?: number;
  wallpaperUrl?: string; // For image or video or gradient or pattern id
  connectorStyle?: 'smooth' | 'squared' | 'straight' | 'rounded';
  showStatistics?: boolean;
}

export interface GoalItem {
  id: string;
  text: string;
  status: 'completed' | 'pending';
}

export interface ContactNode {
  id: string;
  name: string;
  title: string;
  department: string;
  email: string;
  phone: string;
  managerId: string | null;
  relationship: RelationshipType;
  influence: InfluenceLevel;
  notes?: string;
  isPlaceholder?: boolean; // For "Vaccant" / Open positions
  customFields?: Record<string, string>;
  avatarUrl?: string;
  createdAt?: string;
  goals?: GoalItem[];
  isDepartment?: boolean; // For department cards representing functions/duties
  themeColor?: string;
}

export interface LegendItem {
  type: RelationshipType;
  label: string;
  color: string; // Base Tailwind color class or hex
  description: string;
}
