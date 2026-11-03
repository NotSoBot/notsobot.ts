import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { GuildFeatures } from '../../../../../constants';
import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../../basecommand';


export class TTSVoiceServerSampleCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Add another Audio or Video File to one of the server\'s cloned voices';
  metadata = {
    id: Formatter.Commands.VoiceServer.COMMAND_ID_SAMPLE,
    premiumServer: GuildFeatures.VOICE_CLONE_ACCESS,
  };
  name = 'sample';
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {name: 'voice', description: 'The server\'s cloned voice', required: true, onAutoComplete: Parameters.AutoComplete.serverVoices},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.VoiceCloneAdd.CommandArgs) {
    return Formatter.Commands.VoiceCloneAdd.createMessage(context, {...args, server: true});
  }
}
