import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaAudioVocoderSynths, MediaAudioVocoderSynthsToText } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseMediaCommand } from '../basecommand';


export const COMMAND_NAME = 'vocoderchord';

export default class AudioVocoderChordCommand extends BaseMediaCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['chordvocoder', 'audio vocoderchord', 'a vocoderchord'],
      args: [
        {name: 'synth', aliases: ['s'], type: Parameters.oneOf({choices: MediaAudioVocoderSynths, descriptions: MediaAudioVocoderSynthsToText})},
        {name: 'bands', aliases: ['b'], type: Number, metadata: {description: '1 to 512'}},
      ],
      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Make the voice in an Audio or Video sing a chord, no music needed',
        examples: [
          `${COMMAND_NAME} https://notsobot.com/some/video/file.mp4`,
          `${COMMAND_NAME} https://notsobot.com/some/video/file.mp4 A3,C4,E4 -synth pad`,
          `${COMMAND_NAME} https://notsobot.com/some/audio/voice.mp3 C3,G3,C4 -synth robot -bands 16`,
        ],
        id: Formatter.Commands.MediaAVManipulationAudioVocoderChord.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<notes,comma-separated> (-synth <MediaAudioVocoderSynths>) (-bands <number>)',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: true, image: false, video: true})},
        {name: 'chord', consume: true},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVManipulationAudioVocoderChord.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioVocoderChord.createMessage(context, args);
  }
}
