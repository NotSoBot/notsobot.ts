import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'labels';

export class ToolsLabelsCommand extends BaseInteractionImageCommandOption {
  description = 'Get the labels of an Image';
  descriptionLocalizations = I18n.localizations('commands.tools.labels.description');
  metadata = {
    id: Formatter.Commands.ToolsLabels.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.tools.labels.name');

  constructor() {
    super({
      permissionsClient: [Permissions.EMBED_LINKS],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsLabels.CommandArgs) {
    return Formatter.Commands.ToolsLabels.createMessage(context, args);
  }
}
