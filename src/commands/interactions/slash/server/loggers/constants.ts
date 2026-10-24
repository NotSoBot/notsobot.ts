import { GuildLoggerTypes } from '../../../../../constants';
import { Parameters } from '../../../../../utils';


export const LOGGER_TYPE_CHOICES = [
  Parameters.Slash.createChoice('Bans', GuildLoggerTypes.BANS, {localizationKey: 'choices.guild_logger_types.bans'}),
  Parameters.Slash.createChoice('Channels', GuildLoggerTypes.CHANNELS, {localizationKey: 'choices.guild_logger_types.channels'}),
  Parameters.Slash.createChoice('Members', GuildLoggerTypes.MEMBERS, {localizationKey: 'choices.guild_logger_types.members'}),
  Parameters.Slash.createChoice('Messages', GuildLoggerTypes.MESSAGES, {localizationKey: 'choices.guild_logger_types.messages'}),
  Parameters.Slash.createChoice('Moderation', GuildLoggerTypes.MODERATION, {localizationKey: 'choices.guild_logger_types.moderation'}),
  Parameters.Slash.createChoice('Roles', GuildLoggerTypes.ROLES, {localizationKey: 'choices.guild_logger_types.roles'}),
  Parameters.Slash.createChoice('Users', GuildLoggerTypes.USERS, {localizationKey: 'choices.guild_logger_types.users'}),
  Parameters.Slash.createChoice('Voice', GuildLoggerTypes.VOICE, {localizationKey: 'choices.guild_logger_types.voice'}),
];
