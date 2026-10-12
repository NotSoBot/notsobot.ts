import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class ToolsQrCreateCommand extends BaseInteractionCommandOption {
  description = 'Create a QR code';
  descriptionLocalizations = I18n.localizations('commands.tools.qr.create.description');
  metadata = {
    id: Formatter.Commands.ToolsQrCreate.COMMAND_ID,
  };
  name = 'create';
  nameLocalizations = I18n.localizations('commands.tools.qr.create.name');

  constructor() {
    super({
      options: [
        {
          name: 'query',
          description: 'QR Code\'s Content',
          ...I18n.optionLocalizations('commands.tools.qr.create.query'),
          required: true,
          maxLength: 1248,
          value: Parameters.string({maxLength: 1248}),
        },
        {
          name: 'margin',
          description: 'Size of the QR Code\'s white border',
          ...I18n.optionLocalizations('commands.tools.qr.create.margin'),
          type: ApplicationCommandOptionTypes.INTEGER,
        },
        {
          name: 'size',
          description: 'Size of the QR Code',
          ...I18n.optionLocalizations('commands.tools.qr.create.size'),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsQrCreate.CommandArgs) {
    return Formatter.Commands.ToolsQrCreate.createMessage(context, args);
  }
}
