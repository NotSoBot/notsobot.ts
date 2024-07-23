import { Interaction } from 'detritus-client';
import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  MessageFlags,
} from 'detritus-client/lib/constants';

import { Formatter, findMediaUrlInMessages } from '../../../../utils';

import { BaseContextMenuMessageCommand, ContextMenuMessageArgs } from '../../basecommand';


export interface AudioIdentifyCommandArgs extends ContextMenuMessageArgs {
  url?: string | null,
}

export const COMMAND_NAME = 'Identify Song';

export default class AudioIdentifyCommand extends BaseContextMenuMessageCommand {
  metadata = {
    id: Formatter.Commands.MediaAVToolsIdentify.COMMAND_ID,
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

  onBeforeRun(context: Interaction.InteractionContext, args: AudioIdentifyCommandArgs) {
    args.url = findMediaUrlInMessages([args.message], {image: false});
    return !!args.url;
  }

  onCancelRun(context: Interaction.InteractionContext, args: AudioIdentifyCommandArgs) {
    return context.editOrRespond({
      content: 'Message must have some sort of audio or video to analyze!',
      flags: MessageFlags.EPHEMERAL,
    });
  }

  async run(context: Interaction.InteractionContext, args: AudioIdentifyCommandArgs) {
    return Formatter.Commands.MediaAVToolsIdentify.createMessage(context, {
      isEphemeral: true,
      url: args.url || '',
    });
  }
}
