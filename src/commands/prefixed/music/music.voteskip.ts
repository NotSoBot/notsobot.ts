import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';

import { parseOnOff } from './music.fair';


export const COMMAND_NAME = 'music vote skip';

export default class MusicVoteSkipCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['music voteskip'],
      disableDm: true,
      label: 'value',
      metadata: {
        description: 'Make skipping someone else\'s track a vote, half of who\'s listening has to vote for it (on by default, leave empty to see it). Changing it needs Manage Server or the DJ role',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} on`,
          `${COMMAND_NAME} off`,
        ],
        category: CommandCategories.MUSIC,
        id: Formatter.Commands.MusicVoteSkip.COMMAND_ID,
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
    return Formatter.Commands.MusicVoteSkip.createMessage(context, {enabled: args.value});
  }
}
