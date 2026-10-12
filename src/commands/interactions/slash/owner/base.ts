import { Interaction } from 'detritus-client';
import { InteractionCallbackTypes, MessageFlags } from 'detritus-client/lib/constants';

import { BaseInteractionCommandOption } from '../../basecommand';


export class BaseOwnerCommandOption extends BaseInteractionCommandOption {
  onBefore(context: Interaction.InteractionContext) {
    return context.user.isClientOwner;
  }

  onCancel(context: Interaction.InteractionContext) {
    return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
      content: 'no',
      flags: MessageFlags.EPHEMERAL,
    });
  }
}
