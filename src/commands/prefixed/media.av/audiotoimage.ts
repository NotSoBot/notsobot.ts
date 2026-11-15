import { Command, CommandClient } from 'detritus-client';

import {
  CommandCategories,
  MediaAudioToImageModes,
  MediaAudioToImageModesToText,
  MediaImageToAudioScales,
  MediaImageToAudioScalesToText,
} from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'audiotoimage';

export default class AudioToImageCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['a2i', 'audio2image', 'spectrogram'],
      args: [
        {name: 'high', aliases: ['h'], type: Number, metadata: {description: 'the frequency at the top of the image, 20 to 20000 hz (default: 12000)'}},
        {name: 'invert', aliases: ['i'], type: Boolean, metadata: {description: 'loud is dark instead of bright'}},
        {name: 'low', aliases: ['l'], type: Number, metadata: {description: 'the frequency at the bottom of the image, 20 to 20000 hz (default: 100)'}},
        {name: 'mode', aliases: ['m'], type: Parameters.oneOf({choices: MediaAudioToImageModes, descriptions: MediaAudioToImageModesToText}), metadata: {description: 'spectrogram draws its frequencies over time, raw its bytes as pixels, sstv decodes an SSTV signal (default: Spectrogram)'}},
        {name: 'scale', aliases: ['s'], type: Parameters.oneOf({choices: MediaImageToAudioScales, descriptions: MediaImageToAudioScalesToText}), metadata: {description: 'logarithmic gives every octave the same height (default: Linear)'}},
      ],
      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Turn an Audio or Video file into an image of its spectrogram, its raw bytes or an SSTV signal\'s picture',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3 -scale log -low 50 -high 16000`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3 -mode raw`,
        ],
        id: Formatter.Commands.MediaAVToolsAudioToImage.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-high <number>) (-invert) (-low <number>) (-mode <MediaAudioToImageModes>) (-scale <MediaImageToAudioScales>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVToolsAudioToImage.CommandArgs) {
    return Formatter.Commands.MediaAVToolsAudioToImage.createMessage(context, args);
  }
}
