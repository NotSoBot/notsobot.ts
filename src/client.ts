import {
  Command,
  CommandClient,
  CommandClientOptions,
  CommandClientRunOptions,
} from 'detritus-client';

import { GuildBlacklistTypes, GuildDisableCommandsTypes } from './constants';
import GuildSettingsStore from './stores/guildsettings';


export interface NotSoClientOptions extends CommandClientOptions {
  directory: string, 
}

export interface NotSoClientRunOptions extends CommandClientRunOptions {
  directory?: string,
}

export class NotSoClient extends CommandClient {
  directory?: string;

  constructor(
    options: NotSoClientOptions,
    token?: string,
  ) {
    super(token || '', options);

    if (options.directory) {
      this.directory = options.directory;
    }
  }

  async resetCommands(): Promise<void> {
    this.clear();
    if (this.directory) {
      await this.addMultipleIn(this.directory, {subdirectories: true});
    }
  }

  async run(options: NotSoClientRunOptions = {}) {
    this.directory = options.directory || this.directory;
    if (this.directory) {
      await this.resetCommands();
    }
    return super.run(options);
  }


  async onCommandCheck(context: Command.Context, command: Command.Command) {
    if (context.user.isClientOwner) {
      return true;
    }
    if (command.disableDm && context.inDm) {
      return false;
    }
    const guildId = <string> context.guildId;
    const settings = await GuildSettingsStore.getOrFetch(context, guildId);
    if (settings) {
      const disabledCommands = settings.disabled_commands.filter((disabled) => disabled.command === command.name);
      if (disabledCommands.length) {
        if (disabledCommands.some((disabled) => disabled.type === GuildDisableCommandsTypes.GUILD)) {
          return false;
        }
        if (disabledCommands.some((disabled) => disabled.type === GuildDisableCommandsTypes.CHANNEL && disabled.id === context.channelId)) {
          return false;
        }
        if (disabledCommands.some((disabled) => disabled.type === GuildDisableCommandsTypes.MEMBER && disabled.id === context.userId)) {
          return false;
        }
        const { member } = context;
        if (member) {
          if (disabledCommands.some((disabled) => disabled.type === GuildDisableCommandsTypes.ROLE && member.roles.has(disabled.id))) {
            return false;
          }
        }
      }
      const { blacklist } = settings;
      if (blacklist.length) {
        if (blacklist.some((blacklisted) => blacklisted.type === GuildBlacklistTypes.CHANNEL && blacklisted.id === context.channelId)) {
          return false;
        }
        if (blacklist.some((blacklisted) => blacklisted.type === GuildBlacklistTypes.MEMBER && blacklisted.id === context.userId)) {
          return false;
        }
        const { member } = context;
        if (member) {
          if (blacklist.some((blacklisted) => blacklisted.type === GuildBlacklistTypes.ROLE && member.roles.has(blacklisted.id))) {
            return false;
          }
        }
      }
    }
    return false;
  }

  async onPrefixCheck(context: Command.Context) {
    if (!context.user.bot && context.guildId) {
      const guildId: string = context.guildId;
  
      const settings = await GuildSettingsStore.getOrFetch(context, guildId);
      if (settings && settings.prefixes.length) {
        return settings.prefixes.map(({prefix}) => prefix);
      }
    }
    return this.prefixes.custom;
  }
}
