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

  export interface GuildCommandsAllowlistUpdate {
    commands_allowlist: Array<RestResponsesRaw.GuildCommandsBlocklist>,
    id: string,
  }

  export interface GuildCommandsBlocklistUpdate {
    commands_blocklist: Array<RestResponsesRaw.GuildCommandsBlocklist>,
    id: string,
  }

  export interface GuildFeaturesUpdate {
    features: Array<string>,
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

  export interface InfoDiscordRequest {
    
  }

  export type ReminderCreate = RestResponsesRaw.Reminder;
  export type ReminderDelete = RestResponsesRaw.Reminder;

  export type TagDelete = RestResponsesRaw.Tag;

  export interface TagDeleteBulk {
    dm_user_id: string | null,
    tag_ids: Array<string>,
    server_id: string,
  }

  export type TagUpdate = RestResponsesRaw.Tag;

  export type UserUpdate = RestResponsesRaw.User;
}
