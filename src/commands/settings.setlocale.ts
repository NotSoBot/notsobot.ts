import { Command, Constants } from 'detritus-client';
const { LocalesText : DiscordLocalesText } = Constants;

import { CommandTypes } from '../constants';
import { Arguments, onRunError, onTypeError } from '../utils';


export interface CommandArgs {
  locale: string,
}

export default (<Command.CommandOptions> {
  name: 'setlocale',
  aliases: ['setlanguage'],
  disableDm: true,
  label: 'locale',
  metadata: {
    description: 'Set the guild\'s locale preference.',
    examples: [
      'setlocale en-us',
      'setlocale english',
    ],
    type: CommandTypes.SETTINGS,
    usage: 'setlocale <locale>',
  },
  responseOptional: true,
  type: Arguments.DiscordLocale.type,
  onBefore: (context) => {
    if (!context.channel || !context.channel.canEmbedLinks) {
      return false;
    }
    if (!context.me || !context.me.canManageGuild) {
      return false;
    }
    if (!context.member || !context.member.canManageGuild) {
      return false;
    }
    return true;
  },
  onCancel: (context) => {
    if (!context.channel || !context.channel.canEmbedLinks) {
      return context.editOrReply('⚠ Unable to embed in this channel.');
    }
    if (!context.me || !context.me.canManageGuild) {
      return context.editOrReply('⚠ I need to have Manage Guild permissions.');
    }
    if (!context.member || !context.member.canManageGuild) {
      return context.editOrReply('⚠ You need to have Manage Guild permissions to use this.');
    }
    return context.editOrReply('⚠ unknown.');
  },
  onBeforeRun: (context, args) => !!args.locale,
  onCancelRun: (context, args) => context.editOrReply('⚠ Provide some kind of locale'),
  run: async (context, args: CommandArgs) => {
    const guild = context.guild;
    if (guild) {
      await guild.edit({preferredLocale: args.locale});

      let locale: string;
      if (args.locale in DiscordLocalesText) {
        locale = DiscordLocalesText[args.locale];
      } else {
        locale = args.locale;
      }
      return context.editOrReply(`Successfully edited the guild to ${locale}`);
    }
  },
  onRunError,
  onTypeError,
});
