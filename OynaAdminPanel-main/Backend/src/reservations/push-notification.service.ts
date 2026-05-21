import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DeviceToken,
  DeviceTokenDocument,
} from './schemas/device-token.schema';

let admin: any = null;
let fcmEnabled = false;

@Injectable()
export class PushNotificationService implements OnModuleInit {
  constructor(
    @InjectModel(DeviceToken.name)
    private deviceTokenModel: Model<DeviceTokenDocument>,
  ) { }

  onModuleInit() {
    try {
      // Try to initialize Firebase Admin SDK
      // It will look for GOOGLE_APPLICATION_CREDENTIALS env var
      // or a serviceAccountKey.json file in the backend root
      admin = require('firebase-admin');
      const path = require('path');
      const fs = require('fs');

      const keyPath = path.join(process.cwd(), 'serviceAccountKey.json');

      if (fs.existsSync(keyPath)) {
        if (!admin.apps.length) {
          const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
        }
        fcmEnabled = true;
        console.log('✅ Firebase Admin SDK initialized — FCM push enabled');
      } else {
        console.log('⚠️ serviceAccountKey.json not found in backend root.');
        console.log('   FCM push notifications are DISABLED.');
        console.log('   Download it from Firebase Console > Project Settings > Service Accounts');
        console.log(`   and place it at: ${keyPath}`);
      }
    } catch (error) {
      console.error('Firebase Admin init error:', error.message);
    }
  }

  /** Register or update a user's FCM device token */
  async registerToken(userId: string, fcmToken: string): Promise<void> {
    await this.deviceTokenModel.findOneAndUpdate(
      { userId },
      { userId, fcmToken },
      { upsert: true, new: true },
    );
    console.log(`FCM token registered for user ${userId}`);
  }

  /** Send a push notification to a specific user */
  async sendToUser(
    userId: string,
    title: string,
    body: string,
  ): Promise<void> {
    if (!fcmEnabled || !admin) {
      console.log(`FCM disabled — skipping push to user ${userId}`);
      return;
    }

    const tokenDoc = await this.deviceTokenModel.findOne({ userId });
    if (!tokenDoc) {
      console.log(`No FCM token found for user ${userId}`);
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
          priority: 'high',
          notification: {
            priority: 'max',
            defaultSound: true,
            defaultVibrateTimings: true,
            channelId: 'reservation_channel_id',
          },
        },
      });
      console.log(`✅ FCM notification sent to user ${userId}`);
    } catch (error) {
      console.error(`FCM send error for user ${userId}:`, error.message);
      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        await this.deviceTokenModel.deleteOne({ userId });
      }
    }
  }
}
