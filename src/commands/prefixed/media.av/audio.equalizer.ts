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
        {name: 'air', aliases: ['a']},
        {name: 'bass', aliases: ['b']},
        {name: 'highmids', aliases: ['hm'], label: 'highMids'},
        {name: 'lowmids', aliases: ['lm'], label: 'lowMids'},
        {name: 'mids', aliases: ['m']},
        {name: 'subbass', aliases: ['sb'], label: 'subBass'},
        {name: 'treble', aliases: ['t']},
      ],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Manipulate an Audio or Video\'s Equalizer Settings',
        examples: [
          `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3`,
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
