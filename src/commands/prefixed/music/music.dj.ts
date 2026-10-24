import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';

import { parseOnOff } from './music.fair';


export const COMMAND_NAME = 'music dj';

export default class MusicDjCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['music djmode', 'music dj mode'],
      disableDm: true,
      label: 'value',
      metadata: {
        description: 'DJ mode (on by default): only Manage Server or the DJ role can skip, pause, seek, loop or make the bot leave, anyone can still add songs. Leave empty to see it, changing it needs Manage Server or the DJ role',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} off`,
          `${COMMAND_NAME} on`,
        ],
        category: CommandCategories.MUSIC,
        id: Formatter.Commands.MusicDj.COMMAND_ID,
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
    return Formatter.Commands.MusicDj.createMessage(context, {enabled: args.value});
  }
}
