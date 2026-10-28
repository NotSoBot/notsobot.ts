import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'audio equalizer';

export default class AudioEqualizerCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['a equalizer'],
      args: [
        {name: 'air', aliases: ['a'], metadata: {description: '-50 to 50'}},
        {name: 'bass', aliases: ['b'], metadata: {description: '-50 to 50'}},
        {name: 'highmids', aliases: ['hm'], label: 'highMids', metadata: {description: '-50 to 50'}},
        {name: 'lowmids', aliases: ['lm'], label: 'lowMids', metadata: {description: '-50 to 50'}},
        {name: 'mids', aliases: ['m'], metadata: {description: '-50 to 50'}},
        {name: 'subbass', aliases: ['sb'], label: 'subBass', metadata: {description: '-50 to 50'}},
        {name: 'treble', aliases: ['t'], metadata: {description: '-50 to 50'}},
      ],
      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Boost or cut frequencies in an Audio or Video with an equalizer',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3`,
        ],
        id: Formatter.Commands.MediaAVManipulationAudioEqualizer.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-air <float>) (-bass <float>) (-highmids <float>) (-lowmids <float>) (-mids <float>) (-subbass <float>) (-treble <float>)',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaAVManipulationAudioEqualizer.CommandArgs) {
    return !!args.air || !!args.bass || !!args.highMids || !!args.lowMids || !!args.mids || !!args.subBass || !!args.treble;
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVManipulationAudioEqualizer.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioEqualizer.createMessage(context, args);
  }
}
