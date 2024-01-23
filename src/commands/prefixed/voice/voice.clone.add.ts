import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'voice clone add';

export default class VoiceCloneAddCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['v clone add'],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Add another Audio or Video File to a voice clone for Text-to-Speech',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3`,
        ],
        id: Formatter.Commands.VoiceCloneAdd.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context, args: Formatter.Commands.VoiceCloneAdd.CommandArgs) {
    return Formatter.Commands.VoiceCloneAdd.createMessage(context, args);
  }
}
