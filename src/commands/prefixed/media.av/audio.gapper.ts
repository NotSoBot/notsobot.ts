import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'audio gapper';

export default class AudioGapperCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['a gapper'],
      args: [
        {name: 'frequency', aliases: ['f'], type: 'float', metadata: {description: '0.1 to 100'}},
        {name: 'length', aliases: ['l'], type: 'float', metadata: {description: '1 to 1000'}},
        {name: 'snip', aliases: ['s'], type: Boolean},
      ],
      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Put gaps of silence in an Audio or Video\'s audio, or snip pieces out (Gapper/Snipper)',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/voice.mp3`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/voice.mp3 -frequency 20 -length 20 -snip`,
        ],
        id: Formatter.Commands.MediaAVManipulationAudioGapper.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-frequency <float>) (-length <float>) (-snip)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVManipulationAudioGapper.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioGapper.createMessage(context, args);
  }
}
