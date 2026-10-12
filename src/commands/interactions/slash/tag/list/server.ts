import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class TagListServerCommand extends BaseInteractionCommandOption {
  description = 'List the Server\'s Tags';
  descriptionLocalizations = I18n.localizations('commands.tag.list.server.description');
  metadata = {
    id: Formatter.Commands.TagListServer.COMMAND_ID,
  };
  name = 'server';
  nameLocalizations = I18n.localizations('commands.tag.list.server.name');

  constructor() {
    super({
      options: [
        {
          name: 'content',
          description: 'Match the tag\'s content',
          ...I18n.optionLocalizations('commands.tag.list.server.content'),
          value: Parameters.string({maxLength: 1000}),
        },
        {
          name: 'name',
          description: 'Match the tag\'s name',
          ...I18n.optionLocalizations('commands.tag.list.server.name'),
          value: Parameters.string({maxLength: 64}),
        },
        {
          name: 'user',
          description: 'User to list tags for',
          ...I18n.optionLocalizations('commands.tag.list.server.user'),
          type: ApplicationCommandOptionTypes.USER,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagListServer.CommandArgs) {
    return Formatter.Commands.TagListServer.createMessage(context, args);
  }
}
