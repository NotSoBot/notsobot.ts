import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaNoiseColors, MediaNoiseColorsToText } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'noise';

export default class NoiseCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'amplitude', aliases: ['a', 'volume'], type: 'float', metadata: {description: '0 to 1 (default: 1)'}},
        {name: 'color', aliases: ['c'], type: Parameters.oneOf({choices: MediaNoiseColors, descriptions: MediaNoiseColorsToText}), metadata: {description: 'the kind of noise (default: white)'}},
        {name: 'samplerate', aliases: ['sr'], type: Number, metadata: {description: '8000 to 48000 (default: 44100)'}},
      ],
      label: 'duration',
      type: 'float',
      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Make an audio file of noise, some seconds long',
        examples: [
          `${COMMAND_NAME}`,
          `${COMMAND_NAME} 30 -color brown`,
          `${COMMAND_NAME} 5 -color pink -amplitude 0.5`,
        ],
        id: Formatter.Commands.MediaACreateNoise.COMMAND_ID,
        usage: '?<seconds:float> (-amplitude <float>) (-color <MediaNoiseColors>) (-samplerate <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaACreateNoise.CommandArgs) {
    return Formatter.Commands.MediaACreateNoise.createMessage(context, args);
  }
}
