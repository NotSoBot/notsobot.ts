import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../constants';
import { Formatter, I18n, Parameters, editOrReply } from '../../../../utils';

import { BaseInteractionCommand, BaseInteractionCommandOption } from '../../basecommand';


export class TagRandomCommand extends BaseInteractionCommandOption {
  description = 'Show a random tag';
  descriptionLocalizations = I18n.localizations('commands.tag.random.description');
  metadata = {
    id: Formatter.Commands.TagRandom.COMMAND_ID,
  };
  name = 'random';
  nameLocalizations = I18n.localizations('commands.tag.random.name');

  constructor() {
    super({
      options: [
        {
          name: 'arguments',
          description: 'Tag\'s Arguments',
          ...I18n.optionLocalizations('commands.tag.random.arguments'),
        },
        {
          name: 'content',
          description: 'Match the tag\'s content',
          ...I18n.optionLocalizations('commands.tag.random.content'),
          value: Parameters.string({maxLength: 1000}),
        },
        {
          name: 'name',
          description: 'Match the tag\'s name',
          ...I18n.optionLocalizations('commands.tag.random.name'),
          value: Parameters.string({maxLength: 64}),
        },
        {
          name: 'user',
          description: 'Pick a tag made by this User',
          ...I18n.optionLocalizations('commands.tag.random.user'),
          type: ApplicationCommandOptionTypes.USER,
        },
        {
          name: 'attachment',
          description: 'Media File',
          ...I18n.optionLocalizations('commands.tag.random.attachment'),
          type: ApplicationCommandOptionTypes.ATTACHMENT,
        },
      ],
    });
  }

  onBefore(context: Interaction.InteractionContext) {
    return false;
  }

  onCancel(context: Interaction.InteractionContext) {
    return editOrReply(context, `
### ${StatusEmojis.WARNING} The tag system has been disabled at this time at Discord's request.
Discord gave us two weeks to remove the tag system due to content moderation concerns. We've since added new safety filters and reached out to Discord about keeping the feature. We're sorry for the disruption, especially to everyone who built games and collections with tags. For updates or questions, join our support server: <https://notsobot.com/support/invite>
`
      );
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagRandom.CommandArgs) {
    return Formatter.Commands.TagRandom.createMessage(context, args);
  }
}
