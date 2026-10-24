import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';

import { ON_OFF_VALUES } from './music.fair';


export const COMMAND_NAME = 'music rules length';

const parseSeconds = Parameters.secondsWithOptions({float: false});

export default class MusicRulesLengthCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['music rules duration'],
      disableDm: true,
      label: 'length',
      metadata: {
        description: 'Set the longest track that can be queued, `off` for no limit. Needs Manage Server or a NotSoMusic role',
        examples: [
          `${COMMAND_NAME} 10:00`,
          `${COMMAND_NAME} off`,
        ],
        category: CommandCategories.MUSIC,
        id: Formatter.Commands.MusicRules.COMMAND_ID_LENGTH,
        usage: '<timestamp|off>',
      },
      required: true,
      // seconds, 0 for `off`
      type: (value: string, context: Command.Context) => {
        if (ON_OFF_VALUES[value.trim().toLowerCase()] === false) {
          return 0;
        }
        return parseSeconds(value, context);
      },
    });
  }

  onBeforeRun(context: Command.Context, args: {length?: number}) {
    return typeof(args.length) === 'number' && 0 <= args.length && args.length <= 24 * 60 * 60;
  }

  async onCancelRun(context: Command.Context) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_rules.needs_length')}`});
  }

  async run(context: Command.Context, args: {length: number}) {
    return Formatter.Commands.MusicRules.createMessage(context, {maxDuration: args.length});
  }
}
