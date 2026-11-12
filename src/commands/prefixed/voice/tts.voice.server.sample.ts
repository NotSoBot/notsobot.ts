import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'tts voice server sample';

export default class TTSVoiceServerSampleCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
      aliases: ['server voice sample'],

      disableDm: true,
      metadata: {
        category: CommandCategories.SERVER,
        description: 'Add another Audio or Video File to one of the server\'s cloned voices',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/voice.mp3 cake`,
        ],
        id: Formatter.Commands.VoiceServer.COMMAND_ID_SAMPLE,
        usage: '?<emoji,user:id|mention,url> <...voice:string>',
      },
      permissions: [Permissions.MANAGE_GUILD],
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({image: false})},
        {name: 'voice', consume: true},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.VoiceCloneAdd.CommandArgs) {
    return !!args.voice && super.onBeforeRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.VoiceCloneAdd.CommandArgs) {
    return Formatter.Commands.VoiceCloneAdd.createMessage(context, {...args, server: true});
  }
}
