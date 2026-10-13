import { Interaction } from 'detritus-client';

import { GuildAllowlistTypes } from '../../../../../constants';
import { Formatter, I18n, toTitleCase } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'list';

export class ModerationAllowlistListCommand extends BaseInteractionCommandOption {
  description = 'List all channels/roles/users part of the server\'s allowlist';
  descriptionLocalizations = I18n.localizations('commands.moderation.allowlist.list.description');
  metadata = {
    id: Formatter.Commands.ModerationAllowlist.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.allowlist.list.name');

  constructor() {
    super({
      options: [
        {
          name: 'only',
          description: 'Only show this type',
          ...I18n.optionLocalizations('commands.moderation.allowlist.list.only'),
          choices: Object.values(GuildAllowlistTypes).map((value) => ({name: toTitleCase(value), value})),
          default: null,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ModerationAllowlist.CommandArgs) {
    return Formatter.Commands.ModerationAllowlist.createMessage(context, args);
  }
}
