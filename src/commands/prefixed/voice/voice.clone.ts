import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'voice clone';

export default class VoiceCloneCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['v clone'],
      args: [
        {name: 'name'},
      ],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Clone a voice from an Audio or Video File to use for Text-to-Speech',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3`,
          `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3 -name cake`,
        ],
        id: Formatter.Commands.VoiceClone.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-name <string>)',
      },
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context, args: Formatter.Commands.VoiceClone.CommandArgs) {
    return Formatter.Commands.VoiceClone.createMessage(context, args);
  }
}
