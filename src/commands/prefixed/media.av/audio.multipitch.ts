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
        {name: 'formants', aliases: ['f'], type: Boolean},
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
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3 -5 -engine a17`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3 7 -engine elastique`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/voice.mp3 -12 -5 0 7 -engine elastique -formants`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3 major 12@0.5`,
        ],
        id: Formatter.Commands.MediaAVManipulationAudioMultiPitch.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<semitones|chord,comma or space separated,@volume> (-normalize) (-engine <choice>) (-formants)',
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
