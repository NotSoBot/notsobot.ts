import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { DefaultParameters, Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {
  global?: boolean,
  user: Structures.Member | Structures.User,
}

export class TagListUserCommand extends BaseInteractionCommandOption {
  description = 'List all of a user\'s tags';
  descriptionLocalizations = I18n.localizations('commands.tag.list.user.description');
  metadata = {
    id: Formatter.Commands.TagListUser.COMMAND_ID,
  };
  name = 'user';
  nameLocalizations = I18n.localizations('commands.tag.list.user.name');

  constructor() {
    super({
      options: [
        {
          name: 'user',
          description: 'User to list tags for',
          ...I18n.optionLocalizations('commands.tag.list.user.user'),
          default: DefaultParameters.author,
          type: ApplicationCommandOptionTypes.USER,
        },
        {
          name: 'content',
          description: 'Match the tag\'s content',
          ...I18n.optionLocalizations('commands.tag.list.user.content'),
          maxLength: 1000,
          value: Parameters.string({maxLength: 1000}),
        },
        {
          name: 'global',
          description: 'Only show global tags',
          ...I18n.optionLocalizations('commands.tag.list.user.global'),
          type: Boolean,
        },
        {
          name: 'name',
          description: 'Match the tag\'s name',
          ...I18n.optionLocalizations('commands.tag.list.user.name'),
          maxLength: 64,
          value: Parameters.string({maxLength: 64}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.TagListUser.createMessage(context, args);
  }
}
