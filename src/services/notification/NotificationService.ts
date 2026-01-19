export abstract class NotificationService {
  abstract sendMessage(message: string): Promise<void>;
  abstract sendMessageWithImage(message: string, imageUrl: string): Promise<void>;
  abstract sendLocalImage(message: string, imagePath: string): Promise<void>;
}
