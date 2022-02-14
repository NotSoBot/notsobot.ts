import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class ToolsQrCreateCommand extends BaseInteractionCommandOption {
  description = 'Create a QR code';
  metadata = {
    id: Formatter.Commands.ToolsQrCreate.COMMAND_ID,
  };
  name = 'create';

  constructor() {
    super({
      options: [
        {
          name: 'query',
          description: 'QR Code\'s Content',
          required: true,
          value: Parameters.string({maxLength: 1248}),
        },
        {
          name: 'margin',
          description: 'Size of the QR Code\'s white border',
          type: ApplicationCommandOptionTypes.INTEGER,
        },
        {
          name: 'size',
          description: 'Size of the QR Code',
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsQrCreate.CommandArgs) {
    return Formatter.Commands.ToolsQrCreate.createMessage(context, args);
  }
}
