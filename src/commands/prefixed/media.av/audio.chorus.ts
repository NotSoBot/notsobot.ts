import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'audio chorus';

export default class AudioChorusCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['a chorus'],
      args: [
        {name: 'voices', aliases: ['v'], type: Number, metadata: {description: '1 to 3'}},
        {name: 'delay', aliases: ['d'], type: 'float', metadata: {description: '1 to 100'}},
        {name: 'rate', aliases: ['r'], type: 'float', metadata: {description: '0.01 to 20'}},
        {name: 'depth', aliases: ['dp'], type: 'float', metadata: {description: '1 to 100'}},
        {name: 'mix', aliases: ['m'], type: 'float', metadata: {description: '0 to 1'}},
      ],
      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Add a chorus to an Audio or Video, copies of the sound singing along slightly out of time',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/voice.mp3`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/voice.mp3 -voices 1 -depth 100 -rate 4`,
        ],
        id: Formatter.Commands.MediaAVManipulationAudioChorus.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-voices <number>) (-delay <float>) (-rate <float>) (-depth <float>) (-mix <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVManipulationAudioChorus.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioChorus.createMessage(context, args);
  }
}
