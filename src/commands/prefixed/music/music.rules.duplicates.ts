import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';

import { parseOnOff } from './music.fair';


export const COMMAND_NAME = 'music rules duplicates';

export default class MusicRulesDuplicatesCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      label: 'value',
      metadata: {
        description: 'Let the same track be queued more than once at a time (on by default), `off` only lets it in once. Needs Manage Server or the DJ role',
        examples: [
          `${COMMAND_NAME} off`,
          `${COMMAND_NAME} on`,
        ],
        category: CommandCategories.MUSIC,
        id: Formatter.Commands.MusicRules.COMMAND_ID_DUPLICATES,
        usage: '<on|off>',
      },
      required: true,
      type: parseOnOff,
    });
  }

  onBeforeRun(context: Command.Context, args: {value?: boolean | null}) {
    return typeof(args.value) === 'boolean';
  }

  async onCancelRun(context: Command.Context) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_fair.needs_value')}`});
  }

  async run(context: Command.Context, args: {value: boolean}) {
    return Formatter.Commands.MusicRules.createMessage(context, {duplicates: args.value});
  }
}
