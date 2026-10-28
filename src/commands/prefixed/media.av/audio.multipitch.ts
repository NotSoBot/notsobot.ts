import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaAudioMultiPitchEngines, MediaAudioMultiPitchEnginesToText } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseMediaCommand } from '../basecommand';


export const COMMAND_NAME = 'audio multipitch';

export default class AudioMultiPitchCommand extends BaseMediaCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['a multipitch'],
      args: [
        {name: 'normalize', aliases: ['n'], type: Boolean},
        {name: 'engine', aliases: ['e'], type: Parameters.oneOf({choices: MediaAudioMultiPitchEngines, descriptions: MediaAudioMultiPitchEnginesToText})},
      ],
      metadata: {
        category: CommandCategories.AUDIO,
        credits: Formatter.Commands.MediaAVManipulationAudioMultiPitch.CREDITS,
        description: 'Pitch shift an Audio or Video by semitones without changing its speed, or mix pitches into a chord',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3 7`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3 0,7,12`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3 0,4,7 -normalize`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3 0,7,12 -engine rubberband`,
        ],
        id: Formatter.Commands.MediaAVManipulationAudioMultiPitch.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<semitones,comma-separated> (-normalize) (-engine <choice>)',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: true, image: false, video: true})},
        {name: 'semitones', consume: true},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVManipulationAudioMultiPitch.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioMultiPitch.createMessage(context, args);
  }
}
