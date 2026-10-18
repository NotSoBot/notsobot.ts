import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaAudioBitcrushModes, MediaAudioBitcrushModesToText } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'audio bitcrush';

export default class AudioBitcrushCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['a bitcrush', 'audio crush', 'a crush'],
      args: [
        {name: 'samples', aliases: ['s'], type: Number, metadata: {description: '1 to 250'}},
        {name: 'bits', aliases: ['b'], type: Number, metadata: {description: '1 to 64'}},
        {name: 'mix', aliases: ['m'], type: 'float', metadata: {description: '0 to 1'}},
        {name: 'mode', type: Parameters.oneOf({choices: MediaAudioBitcrushModes, descriptions: MediaAudioBitcrushModesToText})},
      ],
      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Bit Crush an Audio or Video\'s audio, lowering its sample rate and bit depth',
        examples: [
          `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3`,
          `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3 -samples 12 -bits 4 -mode lin`,
        ],
        id: Formatter.Commands.MediaAVManipulationAudioBitcrush.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-samples <number>) (-bits <number>) (-mix <float>) (-mode <MediaAudioBitcrushModes>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVManipulationAudioBitcrush.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioBitcrush.createMessage(context, args);
  }
}
