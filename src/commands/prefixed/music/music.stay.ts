import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, GuildFeatures, StatusEmojis } from '../../../constants';
import { Formatter, I18n, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';

import { parseOnOff } from './music.fair';


export const COMMAND_NAME = 'music 247';

export default class MusicStayCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['music 24/7', 'music stay'],
      disableDm: true,
      label: 'value',
      metadata: {
        description: 'Keep the bot in voice when the queue runs out or it\'s paused, it comes back after restarts too (a premium server perk, on by default, leave empty to see it). Changing it needs Manage Server or the DJ role',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} off`,
          `${COMMAND_NAME} on`,
        ],
        category: CommandCategories.MUSIC,
        // premium users, premium servers and servers given the feature (`owner guild features add`), it only does
        // anything on a premium server
        premiumServer: GuildFeatures.MUSIC_ACCESS,
        id: Formatter.Commands.MusicStay.COMMAND_ID,
        usage: '(on|off)',
      },
      type: parseOnOff,
    });
  }

  onBeforeRun(context: Command.Context, args: {value?: boolean | null}) {
    return args.value !== undefined;
  }

  async onCancelRun(context: Command.Context) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_fair.needs_value')}`});
  }

  async run(context: Command.Context, args: {value: boolean | null}) {
    return Formatter.Commands.MusicStay.createMessage(context, {enabled: args.value});
  }
}
