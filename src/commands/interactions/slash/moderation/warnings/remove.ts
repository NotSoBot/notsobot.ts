import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {
  ids: string,
}

export const COMMAND_NAME = 'remove';

export class ModerationWarningsRemoveCommand extends BaseInteractionCommandOption {
  description = 'Remove warnings by their ids';
  descriptionLocalizations = I18n.localizations('commands.moderation.warnings.remove.description');
  metadata = {
    id: Formatter.Commands.ModerationWarningsRemove.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.warnings.remove.name');

  constructor() {
    super({
      permissions: [Permissions.MODERATE_MEMBERS],
      options: [
        {
          name: 'ids',
          description: 'Warning IDs from the warnings list, separated by spaces',
          ...I18n.optionLocalizations('commands.moderation.warnings.remove.ids'),
          required: true,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.ModerationWarningsRemove.createMessage(context, args);
  }
}
