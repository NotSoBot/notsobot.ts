import moment from 'moment';

import { Collections, ShardClient, Structures } from 'detritus-client';
import { DiscordAbortCodes } from 'detritus-client/lib/constants';
import { RequestTypes } from 'detritus-client-rest';

import { deleteGuildLogger } from '../../api';
import {
  EmbedBrands,
  GuildAllowlistTypes,
  GuildBlocklistTypes,
  GuildCommandsAllowlistTypes,
  GuildCommandsBlocklistTypes,
  GuildLoggerFlags,
  GuildLoggerTypes,
  GuildPremiumTypes,
  NotSoApiKeys,
} from '../../constants';

import { BaseStructure } from './basestructure';


const keysGuildSettings = new Collections.BaseSet<string>([
  NotSoApiKeys.ALLOWLIST,
  NotSoApiKeys.BLOCKED,
  NotSoApiKeys.BLOCKED_REASON,
  NotSoApiKeys.BLOCKLIST,
  NotSoApiKeys.COMMANDS_ALLOWLIST,
  NotSoApiKeys.COMMANDS_BLOCKLIST,
  NotSoApiKeys.DISABLED_LOGGER_EVENTS,
  NotSoApiKeys.FEATURES,
  NotSoApiKeys.ICON,
  NotSoApiKeys.ID,
  NotSoApiKeys.LOGGER_FLAGS,
  NotSoApiKeys.LOGGERS,
  NotSoApiKeys.NAME,
  NotSoApiKeys.PREFIXES,
  NotSoApiKeys.PREMIUM_TYPE,
  NotSoApiKeys.SETTINGS,
  NotSoApiKeys.TIMEZONE,
]);

export class GuildSettings extends BaseStructure {
  readonly _keys = keysGuildSettings;
  _allowlist?: Collections.BaseCollection<string, GuildSettingsAllowlist>;
  _blocklist?: Collections.BaseCollection<string, GuildSettingsBlocklist>;
  _commandsAllowlist?: Collections.BaseCollection<string, GuildSettingsCommandsAllowlist>;
  _commandsBlocklist?: Collections.BaseCollection<string, GuildSettingsCommandsBlocklist>;
  _loggers?: Collections.BaseCollection<string, GuildSettingsLogger>;
  _prefixes?: Collections.BaseCollection<string, GuildSettingsPrefix>;

  blocked: boolean = false;
  blockedReason: string | null = null;
  disabledLoggerEvents: number = 0;
  features = new Collections.BaseSet<string>();
  icon: string | null = null;
  id: string = '';
  name: string = '';
  premiumType: GuildPremiumTypes = GuildPremiumTypes.NONE;
  settings!: GuildSettingsChild;
  timezone: string | null = null;

  constructor(data: Structures.BaseStructureData) {
    super();
    this.merge(data);
  }

  get allowlist(): Collections.BaseCollection<string, GuildSettingsAllowlist> {
    if (this._allowlist) {
      return this._allowlist;
    }
    return Collections.emptyBaseCollection;
  }

  get blocklist(): Collections.BaseCollection<string, GuildSettingsBlocklist> {
    if (this._blocklist) {
      return this._blocklist;
    }
    return Collections.emptyBaseCollection;
  }

  get commandsAllowlist(): Collections.BaseCollection<string, GuildSettingsCommandsAllowlist> {
    if (this._commandsAllowlist) {
      return this._commandsAllowlist;
    }
    return Collections.emptyBaseCollection;
  }

  get commandsBlocklist(): Collections.BaseCollection<string, GuildSettingsCommandsBlocklist> {
    if (this._commandsBlocklist) {
      return this._commandsBlocklist;
    }
    return Collections.emptyBaseCollection;
  }

  get loggers(): Collections.BaseCollection<string, GuildSettingsLogger> {
    if (this._loggers) {
      return this._loggers;
    }
    return Collections.emptyBaseCollection;
  }

  get prefixes(): Collections.BaseCollection<string, GuildSettingsPrefix> {
    if (this._prefixes) {
      return this._prefixes;
    }
    return Collections.emptyBaseCollection;
  }

  hasFeature(feature: string): boolean {
    if (this.features) {
      return this.features.has(feature);
    }
    return false;
  }

  hasDisabledLoggerEventFlag(flag: number): boolean {
    return (this.disabledLoggerEvents & flag) === flag;
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case NotSoApiKeys.ALLOWLIST: {
          if (value.length) {
            if (!this._allowlist) {
              this._allowlist = new Collections.BaseCollection<string, GuildSettingsAllowlist>();
            }
            this._allowlist.clear();
            for (let raw of value) {
              const item = new GuildSettingsAllowlist(raw);
              this._allowlist.set(item.key, item);
            }
          } else {
            if (this._allowlist) {
              this._allowlist.clear();
              this._allowlist = undefined;
            }
          }
        }; return;
        case NotSoApiKeys.BLOCKLIST: {
          if (value.length) {
            if (!this._blocklist) {
              this._blocklist = new Collections.BaseCollection<string, GuildSettingsBlocklist>();
            }
            this._blocklist.clear();
            for (let raw of value) {
              const item = new GuildSettingsBlocklist(raw);
              this._blocklist.set(item.key, item);
            }
          } else {
            if (this._blocklist) {
              this._blocklist.clear();
              this._blocklist = undefined;
            }
          }
        }; return;
        case NotSoApiKeys.COMMANDS_ALLOWLIST: {
          if (value.length) {
            if (!this._commandsAllowlist) {
              this._commandsAllowlist = new Collections.BaseCollection<string, GuildSettingsCommandsAllowlist>();
            }
            this._commandsAllowlist.clear();
            for (let raw of value) {
              const item = new GuildSettingsCommandsAllowlist(raw);
              this._commandsAllowlist.set(item.key, item);
            }
          } else {
            if (this._commandsAllowlist) {
              this._commandsAllowlist.clear();
              this._commandsAllowlist = undefined;
            }
          }
        }; return;
        case NotSoApiKeys.COMMANDS_BLOCKLIST: {
          if (value.length) {
            if (!this._commandsBlocklist) {
              this._commandsBlocklist = new Collections.BaseCollection<string, GuildSettingsCommandsBlocklist>();
            }
            this._commandsBlocklist.clear();
            for (let raw of value) {
              const item = new GuildSettingsCommandsBlocklist(raw);
              this._commandsBlocklist.set(item.key, item);
            }
          } else {
            if (this._commandsBlocklist) {
              this._commandsBlocklist.clear();
              this._commandsBlocklist = undefined;
            }
          }
        }; return;
        case NotSoApiKeys.FEATURES: {
          if (this.features) {
            this.features.clear();
            for (let raw of value) {
              this.features.add(raw);
            }
          } else {
            this.features = new Collections.BaseSet<string>(value);
          }
        }; return;
        case NotSoApiKeys.LOGGERS: {
          if (value.length) {
            if (!this._loggers) {
              this._loggers = new Collections.BaseCollection<string, GuildSettingsLogger>();
            }
            this._loggers.clear();
            for (let raw of value) {
              const item = new GuildSettingsLogger(raw);
              this._loggers.set(item.key, item);
            }
          } else {
            if (this._loggers) {
              this._loggers.clear();
              this._loggers = undefined;
            }
          }
        }; return;
        case NotSoApiKeys.PREFIXES: {
          if (value.length) {
            if (!this._prefixes) {
              this._prefixes = new Collections.BaseCollection<string, GuildSettingsPrefix>();
            }
            this._prefixes.clear();
            for (let raw of value) {
              const item = new GuildSettingsPrefix(raw);
              this._prefixes.set(item.prefix, item);
            }
          } else {
            if (this._prefixes) {
              this._prefixes.clear();
              this._prefixes = undefined;
            }
          }
        }; return;
        case NotSoApiKeys.SETTINGS: {
          value = new GuildSettingsChild(value);
        }; break;
      }
    }
    return super.mergeValue(key, value);
  }
}


const keysGuildSettingsAllowlistAndBlocklist = new Collections.BaseSet<string>([
  NotSoApiKeys.ADDED,
  NotSoApiKeys.ID,
  NotSoApiKeys.TYPE,
  NotSoApiKeys.USER_ID,
]);

export class GuildSettingsAllowlist extends BaseStructure {
  readonly _keys = keysGuildSettingsAllowlistAndBlocklist;

  added: string = '';
  id: string = '';
  type!: GuildAllowlistTypes;
  userId: string = '';

  constructor(data: Structures.BaseStructureData) {
    super();
    this.merge(data);
  }

  get addedAtText(): string {
    return moment(this.added).fromNow();
  }

  get key(): string {
    return `${this.id}.${this.type}`;
  }
}


export class GuildSettingsBlocklist extends BaseStructure {
  readonly _keys = keysGuildSettingsAllowlistAndBlocklist;

  added: string = '';
  id: string = '';
  type!: GuildBlocklistTypes;
  userId: string = '';

  constructor(data: Structures.BaseStructureData) {
    super();
    this.merge(data);
  }

  get addedAtText(): string {
    return moment(this.added).fromNow();
  }

  get key(): string {
    return `${this.id}.${this.type}`;
  }
}


const keysGuildSettingsCommandsAllowlist = new Collections.BaseSet<string>([
  NotSoApiKeys.ADDED,
  NotSoApiKeys.COMMAND,
  NotSoApiKeys.ID,
  NotSoApiKeys.TYPE,
  NotSoApiKeys.USER_ID,
]);

export class GuildSettingsCommandsAllowlist extends BaseStructure {
  readonly _keys = keysGuildSettingsCommandsAllowlist;

  added: string = '';
  command: string = '';
  id: string = '';
  type!: GuildCommandsAllowlistTypes;
  userId: string = '';

  constructor(data: Structures.BaseStructureData) {
    super();
    this.merge(data);
  }

  get addedAtText(): string {
    return moment(this.added).fromNow();
  }

  get key(): string {
    return `${this.command}.${this.id}.${this.type}`;
  }

  /*
  async delete(shard: ShardClient) {
    return deleteGuildDisabledCommand({client: shard}, this.guildId, {
      channelId: this.channelId,
      loggerType: this.type,
    });
  }
  */
}


const keysGuildSettingsCommandsBlocklist = new Collections.BaseSet<string>([
  NotSoApiKeys.ADDED,
  NotSoApiKeys.COMMAND,
  NotSoApiKeys.ID,
  NotSoApiKeys.TYPE,
  NotSoApiKeys.USER_ID,
]);

export class GuildSettingsCommandsBlocklist extends BaseStructure {
  readonly _keys = keysGuildSettingsCommandsBlocklist;

  added: string = '';
  command: string = '';
  id: string = '';
  type!: GuildCommandsBlocklistTypes;
  userId: string = '';

  constructor(data: Structures.BaseStructureData) {
    super();
    this.merge(data);
  }

  get addedAtText(): string {
    return moment(this.added).fromNow();
  }

  get key(): string {
    return `${this.command}.${this.id}.${this.type}`;
  }

  /*
  async delete(shard: ShardClient) {
    return deleteGuildDisabledCommand({client: shard}, this.guildId, {
      channelId: this.channelId,
      loggerType: this.type,
    });
  }
  */
}


const keysGuildSettingsLogger = new Collections.BaseSet<string>([
  NotSoApiKeys.ADDED,
  NotSoApiKeys.CHANNEL_ID,
  NotSoApiKeys.GUILD_ID,
  NotSoApiKeys.TYPE,
  NotSoApiKeys.USER_ID,
  NotSoApiKeys.WEBHOOK_ID,
  NotSoApiKeys.WEBHOOK_TOKEN,
]);

export class GuildSettingsLogger extends BaseStructure {
  readonly _keys = keysGuildSettingsLogger;

  added: string = '';
  channelId: string = '';
  disabledEvents: number = 0;
  guildId: string = '';
  type!: GuildLoggerTypes;
  userId: string = '';
  webhookId?: string;
  webhookToken?: string;

  constructor(data: Structures.BaseStructureData) {
    super();
    this.merge(data);
  }

  get addedAtText(): string {
    return moment(this.added).fromNow();
  }

  get key(): string {
    return `${this.type}.${this.channelId}`;
  }

  hasDisabledEventFlag(flag: number): boolean {
    return (this.disabledEvents & flag) === flag;
  }

  async delete(shard: ShardClient) {
    return deleteGuildLogger({client: shard}, this.guildId, {
      channelId: this.channelId,
      type: this.type,
    });
  }

  async execute(
    shard: ShardClient,
    options: RequestTypes.ExecuteWebhook | string = {},
    compatibleType?: string,
  ) {
    if (!this.webhookId || !this.webhookToken) {
      throw new Error('Webhook ID or Webhook Token missing');
    }
    // add checks that if this fails because it got deleted, delete it from the server
    options = Object.assign({
      avatarUrl: EmbedBrands.NOTSOBOT,
      username: 'NotSoBot',
    }, options);
    try {
      return await shard.rest.executeWebhook(this.webhookId, this.webhookToken, options, compatibleType);
    } catch(error) {
      switch (error.code) {
        case DiscordAbortCodes.INVALID_WEBHOOK_TOKEN:
        case DiscordAbortCodes.UNKNOWN_WEBHOOK: {
          return this.delete(shard);
        };
        default: {
          throw error;
        };
      }
    }
  }
}


const keysGuildSettingsPrefix = new Collections.BaseSet<string>([
  NotSoApiKeys.ADDED,
  NotSoApiKeys.GUILD_ID,
  NotSoApiKeys.PREFIX,
  NotSoApiKeys.USER_ID,
]);

export class GuildSettingsPrefix extends BaseStructure {
  readonly _keys = keysGuildSettingsPrefix;

  added: string = '';
  guildId: string = '';
  prefix: string = '';
  userId: string = '';

  constructor(data: Structures.BaseStructureData) {
    super();
    this.merge(data);
  }

  get addedAtText(): string {
    return moment(this.added).fromNow();
  }
}


const keysGuildSettingsChild = new Collections.BaseSet<string>([
  NotSoApiKeys.ML_DIFFUSION_MODEL,
  NotSoApiKeys.ML_LLM_MODEL,
  NotSoApiKeys.ML_LLM_PERSONALITY,
]);

export class GuildSettingsChild extends BaseStructure {
  readonly _keys = keysGuildSettingsChild;

  mlDiffusionModel: null | string = null;
  mlLLMModel: null | string = null;
  mlLLMPersonality: null | string = null;

  constructor(data: Structures.BaseStructureData) {
    super();
    this.merge(data);
  }
}
