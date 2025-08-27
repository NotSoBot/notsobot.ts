import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'voice clone add';

export default class VoiceCloneAddCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Add another Audio or Video File to a cloned voice for Text-to-Speech',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3`,
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
