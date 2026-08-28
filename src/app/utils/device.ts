import { DeviceType } from '@prisma/client';
import type { Request } from 'express';

export interface IDeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: DeviceType;
  browser: string;
  os: string;
  ipAddress: string;
  fcmToken?: string;
}

export const extractDeviceInfo = (req: Request): IDeviceInfo => {
  const userAgent = req.headers['user-agent'] || '';

  // Extract browser
  let browser = 'Unknown Browser';
  if (userAgent.includes('Firefox/')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Edg/')) {
    browser = 'Edge';
  } else if (userAgent.includes('Chrome/')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('OPR/') || userAgent.includes('Opera/')) {
    browser = 'Opera';
  }

  // Extract OS
  let os = 'Unknown OS';
  if (userAgent.includes('Win')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac')) {
    os = 'macOS';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
  }

  // Device Type
  let deviceType: DeviceType = DeviceType.WEB;
  if (userAgent.includes('Android')) {
    deviceType = DeviceType.ANDROID;
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    deviceType = DeviceType.IOS;
  }

  if (req.body?.deviceType) {
    if (Object.values(DeviceType).includes(req.body.deviceType)) {
      deviceType = req.body.deviceType as DeviceType;
    }
  }

  const clientIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.socket.remoteAddress ||
    '127.0.0.1';

  const deviceId =
    req.body?.deviceId ||
    (req.headers['x-device-id'] as string) ||
    `device-${Math.random().toString(36).substring(2, 10)}`;

  const deviceName = req.body?.deviceName || `${browser} on ${os}`;
  const fcmToken = req.body?.fcmToken;

  return {
    deviceId,
    deviceName,
    deviceType,
    browser,
    os,
    ipAddress: clientIp,
    fcmToken,
  };
};
