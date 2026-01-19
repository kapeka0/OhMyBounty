export interface NotificationConfig {
  telegram: boolean;
  discord: boolean;
}

export interface AnnouncementConfig {
  enabled: boolean;
  lastAnnouncementId: string | null;
}

export interface CrowdStreamConfig {
  enabled: boolean;
  minimumPriorityNumber: string;
  filterBy: string[];
  lastReportId: string | null;
}

export interface SubdomainMonitorConfig {
  enabled: boolean;
  storeMode: boolean;
  subdomainsDirectory: string;
  screenshotEnabled: boolean;
  hideCodes: number[];
}

export interface Engagement {
  name: string;
  engagementCode: string;
  enabled: boolean;
  platform: string;
  announcements: AnnouncementConfig;
  crowdStream: CrowdStreamConfig;
  subdomainMonitor: SubdomainMonitorConfig;
}

export interface Config {
  engagements: Engagement[];
  cronInterval: string;
  notifications: NotificationConfig;
}
