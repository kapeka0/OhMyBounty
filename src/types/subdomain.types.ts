export interface SubdomainRecord {
  id: number;
  subdomain: string;
  created_at: Date;
}

export interface PageInfo {
  url: string;
  status: number;
  statusText: string;
  responseTime: number;
  ip: string;
  port: number;
  server: string | undefined;
  contentType: string | undefined;
}
