import { RestResponsesRaw } from './api/types';


export namespace RedisPayloads {
  export interface GuildAllowlistUpdate {
    allowlist: Array<RestResponsesRaw.GuildAllowlist>,
    id: string,
  }

  export interface GuildBlocklistUpdate {
    allowlist: Array<RestResponsesRaw.GuildBlocklist>,
    id: string,
  }

  export interface GuildDisabledCommandUpdate {
    disabled_commands: Array<RestResponsesRaw.GuildDisabledCommand>,
    id: string,
  }

  export interface GuildLoggerUpdate {
    id: string,
    loggers: Array<RestResponsesRaw.GuildLogger>,
  }

  export interface GuildPrefixUpdate {
    id: string,
    prefixes: Array<RestResponsesRaw.GuildPrefix>,
  }

  export type GuildSettingsUpdate = RestResponsesRaw.GuildSettings;
}
