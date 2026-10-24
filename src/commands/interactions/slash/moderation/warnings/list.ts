import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes, Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {
  user?: Structures.Member | Structures.User,
}

export const COMMAND_NAME = 'list';

export class ModerationWarningsListCommand extends BaseInteractionCommandOption {
  description = 'List a member\'s warnings, or the server\'s newest ones';
  descriptionLocalizations = I18n.localizations('commands.moderation.warnings.list.description');
  metadata = {
    id: Formatter.Commands.ModerationWarnings.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.warnings.list.name');

  constructor() {
    super({
      permissions: [Permissions.MODERATE_MEMBERS],
      options: [
        {
          name: 'user',
          description: 'Only their warnings',
          ...I18n.optionLocalizations('commands.moderation.warnings.list.user'),
          type: ApplicationCommandOptionTypes.USER,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.ModerationWarnings.createMessage(context, {user: args.user || null});
  }
}
