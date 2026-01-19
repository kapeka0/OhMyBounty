export interface Announcement {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

export interface AnnouncementsResponse {
  announcements: Announcement[];
}

export interface Report {
  id: string;
  title: string | null;
  priority: number;
  created_at: string;
  disclosed: boolean;
  accepted_at: string | null;
  amount: number | null;
  points: number | null;
  substate: string;
  researcher_username: string | null;
  researcher_profile_path: string | null;
  target: string;
  disclosure_report_url: string | null;
  logo_url: string | null;
  engagement_path: string;
}

export interface CrowdStreamResponse {
  results: Report[];
}
