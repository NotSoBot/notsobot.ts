import { Interaction } from 'detritus-client';

import { displayReply } from '../../../../utils';

import { BaseInteractionCommand, BaseInteractionCommandOption } from '../../basecommand';


export class BaseOwnerCommandOption extends BaseInteractionCommandOption {
  onBefore(context: Interaction.InteractionContext): Promise<boolean> | boolean {
    if (!context.user.isClientOwner) {
      return false;
    }
    // replacing the group's `onBefore` skipped its early ephemeral defer (the user's response setting)
    return BaseInteractionCommand.prototype.onBefore.call(this as any, context);
  }

  onCancel(context: Interaction.InteractionContext) {
    if (context.metadata && context.metadata.reason) {
      return BaseInteractionCommand.prototype.onCancel.call(this as any, context);
    }
    return displayReply(context, {description: 'no', ephemeral: true});
  }
}
