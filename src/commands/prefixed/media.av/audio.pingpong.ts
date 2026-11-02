import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'audio pingpong';

export default class AudioPingPongCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['a pingpong', 'audio ping pong'],
      args: [
        {name: 'length', aliases: ['l'], type: 'float', metadata: {description: '10 to 5000'}},
        {name: 'keeplength', aliases: ['k'], type: Boolean},
      ],
      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Cut an Audio or Video\'s audio into pieces that each play forwards then backwards',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/voice.mp3`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/voice.mp3 -length 100 -keeplength`,
        ],
        id: Formatter.Commands.MediaAVManipulationAudioPingPong.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-length <float>) (-keeplength)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVManipulationAudioPingPong.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioPingPong.createMessage(context, args);
  }
}
