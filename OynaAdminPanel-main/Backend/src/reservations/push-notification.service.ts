import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DeviceToken,
  DeviceTokenDocument,
} from './schemas/device-token.schema';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class PushNotificationService implements OnModuleInit {
  private readonly logger = new Logger(PushNotificationService.name);
  private fcmEnabled = false;

  constructor(
    @InjectModel(DeviceToken.name)
    private deviceTokenModel: Model<DeviceTokenDocument>,
  ) {}

  onModuleInit() {
    try {
      const keyPath = path.join(process.cwd(), 'serviceAccountKey.json');

      if (fs.existsSync(keyPath)) {
        if (!admin.apps.length) {
          const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
        }
        this.fcmEnabled = true;
        this.logger.log('Firebase Admin SDK initialized — FCM push enabled');
      } else {
        this.logger.warn(
          `serviceAccountKey.json not found at: ${keyPath} — FCM push notifications DISABLED`,
        );
      }
    } catch (error) {
      this.logger.error(`Firebase Admin init error: ${error.message}`);
    }
  }

  /** Register or update a user's FCM device token */
  async registerToken(userId: string, fcmToken: string): Promise<void> {
    await this.deviceTokenModel.findOneAndUpdate(
      { userId },
      { userId, fcmToken },
      { upsert: true, new: true },
    );
  }

  /** Send a push notification to a specific user */
  async sendToUser(
    userId: string,
    title: string,
    body: string,
  ): Promise<void> {
    if (!this.fcmEnabled) {
      return;
    }

    const tokenDoc = await this.deviceTokenModel.findOne({ userId }).lean().exec();
    if (!tokenDoc) {
      return;
    }

    try {
      await admin.messaging().send({
        token: tokenDoc.fcmToken,
        notification: {
          title,
          body,
        },
        android: {
          priority: 'high' as const,
          notification: {
            priority: 'max' as const,
            defaultSound: true,
            defaultVibrateTimings: true,
            channelId: 'reservation_channel_id',
          },
        },
      });
    } catch (error) {
      this.logger.error(`FCM send error for user ${userId}: ${error.message}`);
      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        await this.deviceTokenModel.deleteOne({ userId });
      }
    }
  }
}
