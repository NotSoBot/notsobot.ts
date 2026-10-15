import { Command, CommandClient } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { CommandCategories } from '../../../constants';
import { Formatter, I18n, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'report';

export default class ReportCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.UTILITY,
        description: 'Send a bug, user, server, or tag report to the NotSoBot developers',
        examples: [
          `${COMMAND_NAME} bug the caption command cuts off long text`,
          `${COMMAND_NAME} user @someone using the bot to spam slurs`,
          `${COMMAND_NAME} server this server uses the bot to spread nsfw`,
        ],
        id: Formatter.Commands.Report.COMMAND_ID,
        usage: '<bug|user|server> ...',
      },
      priority: -2,
    });
  }

  async run(context: Command.Context) {
    const { translate } = await I18n.getTranslator(context);
    const prefix = context.prefix || '';
    return displayReply(context, {
      description: [
        translate('report.usage'),
        `${Markup.codestring(`${prefix}${COMMAND_NAME} bug <description>`)}`,
        `${Markup.codestring(`${prefix}${COMMAND_NAME} user <user> <reason>`)}`,
        `${Markup.codestring(`${prefix}${COMMAND_NAME} server ?<server-id> <reason>`)}`,
        `${Markup.codestring(`${prefix}tag report <tagname> <reason>`)}`,
      ].join('\n'),
    });
  }
}
