import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';

import { parseOnOff } from './music.fair';


export const COMMAND_NAME = 'music vote resume';

export default class MusicVoteResumeCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['music voteresume'],
      disableDm: true,
      label: 'value',
      metadata: {
        description: 'Make resuming someone else\'s paused track a vote, half of who\'s listening has to vote for it, so one person can\'t undo a pause everyone voted for (on by default, leave empty to see it). Changing it needs Manage Server or a NotSoMusic role',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} on`,
          `${COMMAND_NAME} off`,
        ],
        category: CommandCategories.MUSIC,
        id: Formatter.Commands.MusicVoteResume.COMMAND_ID,
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
    return Formatter.Commands.MusicVoteResume.createMessage(context, {enabled: args.value});
  }
}
