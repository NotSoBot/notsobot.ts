import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n, Parameters } from '../../../../utils';

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
          maxLength: 1000,
          value: Parameters.string({maxLength: 1000}),
        },
        {
          name: 'name',
          description: 'Match the tag\'s name',
          ...I18n.optionLocalizations('commands.tag.random.name'),
          maxLength: 64,
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

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagRandom.CommandArgs) {
    return Formatter.Commands.TagRandom.createMessage(context, args);
  }
}
