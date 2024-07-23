import { Interaction } from 'detritus-client';
import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { Formatter } from '../../../../utils';

import { BaseContextMenuUserCommand, ContextMenuUserArgs } from '../../basecommand';


export const COMMAND_NAME = 'Information';

export default class InformationCommand extends BaseContextMenuUserCommand {
  metadata = {
    id: Formatter.Commands.InfoUser.COMMAND_ID,
  };
  name = COMMAND_NAME;

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  async run(context: Interaction.InteractionContext, args: ContextMenuUserArgs) {
    return Formatter.Commands.InfoUser.createMessage(context, {
      isEphemeral: true,
      user: args.member || args.user,
    });
  }
}
