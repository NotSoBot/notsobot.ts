import { Command, CommandClient, Utils } from 'detritus-client';

const { Embed, Markup } = Utils;

import { googleContentVisionOCR } from '../../api';
import { CommandTypes, EmbedBrands, EmbedColors } from '../../constants';
import { Parameters, languageCodeToText } from '../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  noembed: boolean,
  upload: boolean,
  url?: null | string,
}

export interface CommandArgs {
  noembed: boolean,
  upload: boolean,
  url: string,
}

export default class OCRCommand extends BaseImageCommand<CommandArgs> {
  name = 'ocr';

  label = 'url';
  metadata = {
    description: 'Read text inside of an image',
    examples: [
      'ocr',
      'ocr cake',
      'ocr https://cdn.notsobot.com/brands/notsobot.png',
    ],
    type: CommandTypes.TOOLS,
    usage: 'ocr ?<emoji|id|mention|name|url> (-noembed) (-files.gg)',
  };
  type = Parameters.lastImageUrl;

  constructor(client: CommandClient, options: Command.CommandOptions) {
    super(client, {
      ...options,
      args: [
        {name: 'noembed', type: Boolean},
        {name: 'files.gg', label: 'upload', type: Boolean},
      ],
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    await context.triggerTyping();

    const { annotation } = await googleContentVisionOCR(context, {url: args.url});

    let description: string = '';
    if (annotation) {
      if (2000 < annotation.description.length && args.upload) {
        try {
          const upload = await context.rest.request({
            files: [{filename: 'ocr.txt', data: annotation.description, name: 'file'}],
            method: 'post',
            url: 'https://api.files.gg/files',
          });
          description = upload.urls.main;
        } catch(error) {
          description = Markup.codeblock(annotation.description);
        }
      } else {
        description = Markup.codeblock(annotation.description);
      }
    }

    if (args.noembed) {
      if (!annotation) {
        return context.editOrReply({content: '⚠ No text detected'});
      }

      const title = languageCodeToText(annotation.locale);
      return context.editOrReply([title, description].join('\n'));
    } else {
      const embed = new Embed();
      embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, {size: 1024}), context.user.jumpLink);
      embed.setColor(EmbedColors.DEFAULT);
      embed.setFooter('Optical Character Recognition', EmbedBrands.GOOGLE_GO);
      embed.setThumbnail(args.url);

      if (annotation) {
        const language = languageCodeToText(annotation.locale);
        embed.setTitle(language);
        embed.setDescription(description);
      } else {
        embed.setColor(EmbedColors.ERROR);
        embed.setDescription('No text detected');
      }

      return context.editOrReply({embed});
    }
  }
}
