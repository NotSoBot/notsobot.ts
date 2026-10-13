import { Command, CommandClient } from 'detritus-client';

import { RestResponsesRaw } from '../../../api/types';
import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  tag: false | null | RestResponsesRaw.Tag,
}

export const COMMAND_NAME = 'tag info';

export default class TagInfoCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t info', 'tag owner', 't owner', 'tag raw', 't raw'],
      label: 'tag',
      metadata: {
        category: CommandCategories.TAGS,
        description: 'View a tag\'s raw content',
        examples: [
          `${COMMAND_NAME} something`,
          `${COMMAND_NAME} some tag`,
        ],
        id: Formatter.Commands.TagInfo.COMMAND_ID,
        usage: '<tagname>',
      },
      type: Parameters.NotSoTag,
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.tag;
  }

  async onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.tag === false) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag.unknown')}`});
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.TagInfo.CommandArgs) {
    return Formatter.Commands.TagInfo.createMessage(context, args);
  }
}
