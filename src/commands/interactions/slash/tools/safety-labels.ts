import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'safety-labels';

export class ToolsSafetyLabelsCommand extends BaseInteractionImageCommandOption {
  description = 'Get the safety labels of an Image';
  descriptionLocalizations = I18n.localizations('commands.tools.safety_labels.description');
  metadata = {
    id: Formatter.Commands.ToolsSafetyLabels.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.tools.safety_labels.name');

  constructor() {
    super({
      permissionsClient: [Permissions.EMBED_LINKS],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsSafetyLabels.CommandArgs) {
    return Formatter.Commands.ToolsSafetyLabels.createMessage(context, args);
  }
}
