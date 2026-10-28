import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'tts voice sample';

export default class TTSVoiceSampleCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
      aliases: ['voice clone add'],

      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Add another Audio or Video File to one of your cloned voices',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/voice.mp3 cake`,
        ],
        id: Formatter.Commands.VoiceCloneAdd.COMMAND_ID,
        premiumPlus: true,
        usage: '?<emoji,user:id|mention,url> <...voice:string>',
      },
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
    return Formatter.Commands.VoiceCloneAdd.createMessage(context, args);
  }
}
