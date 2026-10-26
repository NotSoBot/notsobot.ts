import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  text: string,
}

export interface CommandArgs {
  text: string,
}

export const COMMAND_NAME = 'tone';

export default class ToneCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['toe', 'analyze', 'perspective'],
      label: 'text',
      metadata: {
        category: CommandCategories.AI,
        description: 'Score how toxic, insulting, threatening or obscene text is',
        examples: [
          `${COMMAND_NAME} you are a wonderful person`,
          `${COMMAND_NAME} https://discord.com/channels/@me/1/2`,
        ],
        id: Formatter.Commands.ToolsTone.COMMAND_ID,
        usage: '<text|message link>',
      },
      type: Parameters.targetTextWithParsedMentions,
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
    return Formatter.Commands.ToolsTone.createMessage(context, args);
  }
}
