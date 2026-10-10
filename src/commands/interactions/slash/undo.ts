import { Interaction } from 'detritus-client';
import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { Formatter } from '../../../utils';

import { BaseSlashCommand } from '../basecommand';


export const COMMAND_NAME = 'undo';

export default class UndoCommand extends BaseSlashCommand {
  description = 'Undo your last commands in this channel';
  metadata = {
    id: Formatter.Commands.UtilsUndo.COMMAND_ID,
  };
  name = COMMAND_NAME;
  triggerLoadingAsEphemeral = true;

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  constructor() {
    super({
      options: [
        {
          name: 'amount',
          description: `Amount of commands to undo (Default: 1)`,
          default: 1,
          maxValue: Formatter.Commands.UtilsUndo.MAX_AMOUNT,
          minValue: 1,
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.UtilsUndo.CommandArgs) {
    return Formatter.Commands.UtilsUndo.createMessage(context, args);
  }
}
