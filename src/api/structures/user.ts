import { Collections, Structures } from 'detritus-client';

import {
  GoogleLocales,
  UserFlags,
  UserPremiumTypes,
  UserFallbacksMediaImageTypes,
  UserUploadThresholdTypes,
  NotSoApiKeys,
} from '../../constants';

import { BaseStructure } from './basestructure';


const keysUser = new Collections.BaseSet<string>([
  NotSoApiKeys.AVATAR,
  NotSoApiKeys.BLOCKED,
  NotSoApiKeys.BLOCKED_REASON,
  NotSoApiKeys.BOT,
  NotSoApiKeys.DISCRIMINATOR,
  NotSoApiKeys.FLAGS,
  NotSoApiKeys.ID,
  NotSoApiKeys.USERNAME,
]);

export class User extends BaseStructure {
  readonly _keys = keysUser;

  avatar: string | null = null;
  blocked: boolean = false;
  blockedReason: string | null = null;
  bot: boolean = false;
  discriminator: string = '0000';
  flags: number = 0;
  id: string = '';
  username: string = '';

  constructor(data?: Structures.BaseStructureData) {
    super();
    if (data) {
      this.merge(data);
    }
  }

  get isPremium(): boolean {
    return this.hasOwner() || this.hasPremiumDiscord();
  }

  hasOwner(): boolean {
    return this.hasFlag(UserFlags.OWNER);
  }

  hasPremiumDiscord(): boolean {
    return this.hasFlag(UserFlags.PREMIUM_DISCORD);
  }

  hasFlag(flag: number): boolean {
    return (this.flags & flag) === flag;
  }
}


const keysUserFull = new Collections.BaseSet<string>([
  NotSoApiKeys.AVATAR,
  NotSoApiKeys.BLOCKED,
  NotSoApiKeys.BLOCKED_REASON,
  NotSoApiKeys.BOT,
  NotSoApiKeys.CHANNEL_ID,
  NotSoApiKeys.DISCRIMINATOR,
  NotSoApiKeys.FALLBACKS,
  NotSoApiKeys.FILE,
  NotSoApiKeys.FLAGS,
  NotSoApiKeys.ID,
  NotSoApiKeys.LOCALE,
  NotSoApiKeys.OPTED_OUT,
  NotSoApiKeys.PREMIUM_TYPE,
  NotSoApiKeys.TIMEZONE,
  NotSoApiKeys.USERNAME,
]);

export class UserFull extends User {
  readonly _keys = keysUserFull;

  avatar: string | null = null;
  blocked: boolean = false;
  blockedReason: string | null = null;
  bot: boolean = false;
  channelId: string | null = null;
  discriminator: string = '0000';
  fallbacks!: UserFallbacks;
  file!: UserFileSettings;
  flags: number = 0;
  id: string = '';
  locale: GoogleLocales | null = null;
  optedOut!: {
    content: string | null,
  };
  premiumType: UserPremiumTypes = UserPremiumTypes.NONE;
  timezone: string | null = null;
  username: string = '';

  constructor(data: Structures.BaseStructureData) {
    super();
    this.merge(data);
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case NotSoApiKeys.FALLBACKS: {
          value = new UserFallbacks(this, value);
        }; break;
        case NotSoApiKeys.FILE: {
          value = new UserFileSettings(this, value);
        }; break;
      }
    }
    return super.mergeValue(key, value);
  }
}


const keysUserFallbacks = new Collections.BaseSet<string>([
  NotSoApiKeys.MEDIA_IMAGE,
]);

export class UserFallbacks extends BaseStructure {
  readonly _keys = keysUserFallbacks;
  readonly user: UserFull;

  mediaImage!: UserFallbacksMediaImageTypes;

  constructor(user: UserFull, data: Structures.BaseStructureData) {
    super();
    this.user = user;
    this.merge(data);
  }
}


const keysUserFileSettings = new Collections.BaseSet<string>([
  NotSoApiKeys.NAME,
  NotSoApiKeys.UPLOAD_THRESHOLD,
  NotSoApiKeys.VANITY,
]);

export class UserFileSettings extends BaseStructure {
  readonly _keys = keysUserFileSettings;
  readonly user: UserFull;

  name: string | null = null;
  uploadThreshold!: UserUploadThresholdTypes;
  vanity: string | null = null;

  constructor(user: UserFull, data: Structures.BaseStructureData) {
    super();
    this.user = user;
    this.merge(data);
  }
}
