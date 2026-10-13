import { Interaction } from 'detritus-client';

import { displayReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class BaseOwnerCommandOption extends BaseInteractionCommandOption {
  onBefore(context: Interaction.InteractionContext) {
    return context.user.isClientOwner;
  }

  onCancel(context: Interaction.InteractionContext) {
    return displayReply(context, {description: 'no', ephemeral: true});
  }
}
