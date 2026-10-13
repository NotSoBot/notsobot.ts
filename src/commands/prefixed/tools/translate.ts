import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, GoogleLocales, StatusEmojis } from '../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  from: GoogleLocales | null,
  text: string,
  to: GoogleLocales | null,
}

export interface CommandArgs {
  from: GoogleLocales | null,
  text: string,
  to: GoogleLocales | null,
}

export const COMMAND_NAME = 'translate';

export default class TranslateCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['tr'],
      args: [
        {name: 'from', default: null, type: Parameters.locale},
        {name: 'to', default: DefaultParameters.locale, type: Parameters.locale},
      ],
      label: 'text',
      metadata: {
        category: CommandCategories.AI,
        description: 'Translate text to a different language',
        examples: [
          `${COMMAND_NAME} не так бот`,
          `${COMMAND_NAME} not so bot -to russian`,
        ],
        id: Formatter.Commands.ToolsTranslate.COMMAND_ID,
        usage: '<text> (-to <language>) (-from <language>)',
      },
      type: Parameters.targetText,
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.text;
  }

  async onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.needs_text')}`});
  }

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.ToolsTranslate.createMessage(context, args);
  }
}
