import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tag random';

export default class TagRandomCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t random'],
      label: 'arguments',
      metadata: {
        category: CommandCategories.TAGS,
        description: 'Show a random tag',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.TagRandom.COMMAND_ID,
        usage: '<...arguments>',
      },
    });
  }

  onBefore(context: Command.Context) {
    return false;
  }

  async onCancel(context: Command.Context) {
    const { translate } = await I18n.getTranslator(context);
    return editOrReply(context, [
      '',
      `### ${StatusEmojis.WARNING} ${translate('tag.disabled_title')}`,
      translate('tag.disabled_body', {invite: '<https://notsobot.com/support/invite>'}),
      '',
    ].join('\n'));
  }

  async run(context: Command.Context, args: Formatter.Commands.TagRandom.CommandArgs) {
    return Formatter.Commands.TagRandom.createMessage(context, args);
  }
}
