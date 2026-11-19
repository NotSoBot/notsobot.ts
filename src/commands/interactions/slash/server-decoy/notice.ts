import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes, Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgs {
  from?: Structures.Member | Structures.User,
  text?: string,
}

export class ServerDecoyNoticeCommand extends BaseInteractionCommandOption {
  permissionsIgnoreClientOwner = false;

  description = 'Replace the decoy channel\'s notice, best with a message in your own words from your account';
  descriptionLocalizations = I18n.localizations('commands.decoy.notice.description');
  metadata = {
    id: Formatter.Commands.ServerDecoy.COMMAND_ID_NOTICE,
  };
  name = 'notice';
  nameLocalizations = I18n.localizations('commands.decoy.notice.name');
  permissions = [Permissions.MANAGE_GUILD, Permissions.BAN_MEMBERS];

  constructor() {
    super({
      options: [
        {
          name: 'from',
          description: 'Their next message there becomes the notice (Default: yours)',
          ...I18n.optionLocalizations('commands.decoy.notice.from'),
          type: ApplicationCommandOptionTypes.USER,
        },
        {
          name: 'text',
          description: 'I post this as the notice instead, or reset for the default',
          ...I18n.optionLocalizations('commands.decoy.notice.text'),
          maxLength: Formatter.Commands.ServerDecoy.NOTICE_MAX_LENGTH,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.ServerDecoy.createNoticeMessage(context, args);
  }
}
