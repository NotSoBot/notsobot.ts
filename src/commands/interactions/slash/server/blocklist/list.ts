import { Interaction } from 'detritus-client';

import { GuildBlocklistTypes } from '../../../../../constants';
import { Formatter, I18n, toTitleCase } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'list';

export class ServerBlocklistListCommand extends BaseInteractionCommandOption {
  description = 'List all channels/roles/users part of the server\'s blocklist';
  descriptionLocalizations = I18n.localizations('commands.moderation.blocklist.list.description');
  metadata = {
    id: Formatter.Commands.ModerationBlocklist.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.blocklist.list.name');

  constructor() {
    super({
      options: [
        {
          name: 'only',
          description: 'Only show this type',
          ...I18n.optionLocalizations('commands.moderation.blocklist.list.only'),
          choices: Object.values(GuildBlocklistTypes).map((value) => ({name: toTitleCase(value), value})),
          default: null,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ModerationBlocklist.CommandArgs) {
    return Formatter.Commands.ModerationBlocklist.createMessage(context, args);
  }
}
