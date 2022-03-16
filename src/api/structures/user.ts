import { Collections, Structures } from 'detritus-client';

import {
  GoogleLocales,
  UserFlags,
  UserPremiumTypes,
  NotSoApiKeys,
} from '../../constants';

import { BaseStructure } from './basestructure';


const keysUser = new Collections.BaseSet<string>([
  NotSoApiKeys.AVATAR,
  NotSoApiKeys.BLOCKED,
  NotSoApiKeys.BOT,
  NotSoApiKeys.DISCRIMINATOR,
  NotSoApiKeys.FLAGS,
  NotSoApiKeys.ID,
  NotSoApiKeys.LOCALE,
  NotSoApiKeys.OPTED_OUT_CONTENT,
  NotSoApiKeys.PREMIUM_TYPE,
  NotSoApiKeys.USERNAME,
]);

export class User extends BaseStructure {
  readonly _keys = keysUser;

  avatar: string | null = null;
  blocked: boolean = false;
  bot: boolean = false;
  discriminator: string = '0000';
  flags: number = 0;
  id: string = '';
  locale: GoogleLocales | null = null;
  optedOutContent: string | null = null;
  premiumType: UserPremiumTypes = UserPremiumTypes.NONE;
  username: string = '';

  constructor(data: Structures.BaseStructureData) {
    super();
    this.merge(data);
  }

  hasOwner(): boolean {
    return this.hasFlag(UserFlags.OWNER);
  }

  hasFlag(flag: number): boolean {
    return (this.flags & flag) === flag;
  }
}
