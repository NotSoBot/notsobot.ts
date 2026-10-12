import { Interaction } from 'detritus-client';
import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  MessageFlags,
} from 'detritus-client/lib/constants';

import { Formatter, I18n, findMediaUrlInMessages } from '../../../../utils';

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
  nameLocalizations = I18n.localizations('commands.context.identify_song.name');

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

  async onCancelRun(context: Interaction.InteractionContext, args: AudioIdentifyCommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return context.editOrRespond({
      content: translate('commands.context.identify_song.no_media'),
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
