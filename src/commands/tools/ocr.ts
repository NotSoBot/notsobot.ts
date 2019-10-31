import { Command, Utils } from 'detritus-client';

const { Markup } = Utils;

import { googleContentVisionOCR } from '../../api';
import { CommandTypes, EmbedBrands, EmbedColors, GoogleLocales, GoogleLocalesText } from '../../constants';
import { Parameters, onRunError, onTypeError } from '../../utils';


export interface CommandArgs {
  noembed: boolean,
  url: string,
}

export default (<Command.CommandOptions> {
  name: 'ocr',
  args: [{name: 'noembed', type: Boolean}],
  label: 'url',
  metadata: {
    description: 'Read text inside of an image',
    examples: [
      'ocr',
      'ocr cake',
      'ocr https://cdn.notsobot.com/brands/notsobot.png',
    ],
    type: CommandTypes.TOOLS,
    usage: 'ocr ?<emoji|id|mention|name|url> (-noembed)',
  },
  ratelimits: [
    {duration: 5000, limit: 5, type: 'guild'},
    {duration: 1000, limit: 1, type: 'channel'},
  ],
  type: Parameters.lastImageUrl,
  onBefore: (context) => !!(context.channel && context.channel.canEmbedLinks),
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

    const { annotation } = await googleContentVisionOCR(context, {url: args.url});

    if (args.noembed) {
      if (!annotation) {
        return context.editOrReply({content: '⚠ No text detected'});
      }

      let title: string;
      if (annotation.locale in GoogleLocalesText) {
        title = GoogleLocalesText[annotation.locale];
      } else {
        title = annotation.locale;
      }

      return context.editOrReply([
        title,
        Markup.codeblock(annotation.description),
      ].join('\n'));
    } else {
      const embed = new Utils.Embed();
      embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, {size: 1024}), context.user.jumpLink);
      embed.setColor(EmbedColors.DEFAULT);
      embed.setFooter('Optical Character Recognition', EmbedBrands.GOOGLE_GO);
      embed.setThumbnail(args.url);

      if (annotation) {
        let language: string = annotation.locale;
        if (annotation.locale in GoogleLocalesText) {
          language = GoogleLocalesText[annotation.locale];
        }
        embed.setTitle(language);
        embed.setDescription(Markup.codeblock(annotation.description));
      } else {
        embed.setColor(EmbedColors.ERROR);
        embed.setDescription('No text detected');
      }

      return context.editOrReply({embed});
    }
  },
  onRunError,
  onTypeError,
});
