import type { Engagement } from '../../types/index.js';

export abstract class MonitorService {
  abstract monitor(engagement: Engagement): Promise<void>;
}
