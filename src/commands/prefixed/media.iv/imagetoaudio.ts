import { Command, CommandClient } from 'detritus-client';

import {
  CommandCategories,
  MediaImageToAudioModes,
  MediaImageToAudioModesToText,
  MediaImageToAudioScales,
  MediaImageToAudioScalesToText,
} from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'imagetoaudio';

export default class ImageToAudioCommand extends BaseImageCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['i2a', 'img2audio', 'sonify'],
      args: [
        {name: 'duration', aliases: ['d', 'length'], type: 'float', metadata: {description: 'seconds, 0.5 to 30 (default: 5, an animation its own length, raw as long as its bytes last)'}},
        {name: 'high', aliases: ['h'], type: Number, metadata: {description: 'the frequency at the top of the image, 20 to 20000 hz (default: 12000)'}},
        {name: 'invert', aliases: ['i'], type: Boolean, metadata: {description: 'dark pixels are loud instead of bright ones'}},
        {name: 'low', aliases: ['l'], type: Number, metadata: {description: 'the frequency at the bottom of the image, 20 to 20000 hz (default: 100)'}},
        {name: 'mode', aliases: ['m'], type: Parameters.oneOf({choices: MediaImageToAudioModes, descriptions: MediaImageToAudioModesToText}), metadata: {description: 'spectrogram draws the image into the sound, raw plays its pixel bytes (default: Spectrogram, a picture `.convert` made from audio plays that audio back)'}},
        {name: 'scale', aliases: ['s'], type: Parameters.oneOf({choices: MediaImageToAudioScales, descriptions: MediaImageToAudioScalesToText}), metadata: {description: 'logarithmic gives every octave the same height (default: Linear)'}},
      ],
      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Turn an Image into sound, drawn into its spectrogram or played as raw bytes',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/photo.jpg -duration 10`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/face.png -scale log -low 200 -high 8000`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/photo.jpg -mode raw`,
        ],
        id: Formatter.Commands.MediaIVToolsImageToAudio.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-duration <float>) (-high <number>) (-invert) (-low <number>) (-mode <MediaImageToAudioModes>) (-scale <MediaImageToAudioScales>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVToolsImageToAudio.CommandArgs) {
    return Formatter.Commands.MediaIVToolsImageToAudio.createMessage(context, args);
  }
}
