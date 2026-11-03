import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { GuildFeatures } from '../../../../../constants';
import { Formatter } from '../../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../../basecommand';


export class TTSVoiceServerCreateCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Clone a voice for everyone here from an Audio or Video File';
  metadata = {
    id: Formatter.Commands.VoiceServer.COMMAND_ID_CREATE,
    premiumServer: GuildFeatures.VOICE_CLONE_ACCESS,
  };
  name = 'create';
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {name: 'name', description: 'Name for the voice', maxLength: 128},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.VoiceClone.CommandArgs) {
    return Formatter.Commands.VoiceClone.createMessage(context, {...args, server: true});
  }
}
