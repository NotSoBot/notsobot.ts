import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tag random';

export default class TagRandomCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t random'],
      label: 'arguments',
      metadata: {
        category: CommandCategories.FUN,
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

  onCancel(context: Command.Context) {
    return editOrReply(context, `
### ${StatusEmojis.WARNING} The tag system has been disabled at this time at Discord's request.
Discord gave us two weeks to remove the tag system due to content moderation concerns. We've since added new safety filters and reached out to Discord about keeping the feature. We're sorry for the disruption, especially to everyone who built games and collections with tags. For updates or questions, join our support server: <https://notsobot.com/support/invite>
`
    );
  }

  async run(context: Command.Context, args: Formatter.Commands.TagRandom.CommandArgs) {
    return Formatter.Commands.TagRandom.createMessage(context, args);
  }
}
