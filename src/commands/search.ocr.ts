import { Command, Constants, Utils } from 'detritus-client';

import { searchGoogleContentVisionOCR } from '../api';
import { EmbedColors, GoogleLocalesText } from '../constants';
import { Parameters, formatMemory, onRunError, onTypeError } from '../utils';


export interface CommandArgs {
  url: string,
}

export default (<Command.CommandOptions> {
  name: 'ocr',
  label: 'url',
  type: Parameters.lastImageUrl,
  onBefore: (context) => {
    const channel = context.channel;
    return (channel) ? channel.canAttachFiles : false;
  },
  onCancel: (context) => context.reply('⚠ Unable to send files in this channel.'),
  onBeforeRun: (context, args) => !!args.url,
  onCancelRun: (context, args) => {
    if (args.url === undefined) {
      return context.editOrReply('⚠ Unable to find any messages with an image.');
    } else {
      return context.editOrReply('⚠ Unable to find that user or it was an invalid url.');
    }
  },
  run: async (context, args: CommandArgs) => {
    await context.triggerTyping();

    const ocr = await searchGoogleContentVisionOCR(context, {
      url: args.url,
      userId: context.user.id,
    });

    const embed = new Utils.Embed();
    embed.setColor(EmbedColors.DEFAULT);

    const [ response ] = ocr.responses;
    const { textAnnotations } = response;
    if (!textAnnotations.length) {
      embed.setColor(EmbedColors.ERROR);
      embed.setTitle('⚠ Command Error');
      embed.setDescription('No text detected');

      return context.editOrReply({embed});
    }

    const annotation = textAnnotations[0];
    if (annotation.locale in GoogleLocalesText) {
      embed.setTitle(GoogleLocalesText[annotation.locale]);
    } else {
      embed.setTitle(annotation.locale);
    }
    embed.setDescription([
      '```',
      annotation.description.slice(0, 2000),
      '```',
    ].join('\n'));
    embed.setFooter('Optical Character Recognition');

    return context.editOrReply({embed});
  },
  onRunError,
  onTypeError,
});
