import { Command } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { googleContentVisionOCR } from '../../api';
import { CommandTypes, EmbedBrands, EmbedColors } from '../../constants';
import { Parameters, createUserEmbed, languageCodeToText } from '../../utils';

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

  args = [
    {name: 'noembed', type: Boolean},
    {name: 'files.gg', label: 'upload', type: Boolean},
  ];
  label = 'url';
  metadata = {
    description: 'Read text inside of an image',
    examples: [
      'ocr',
      'ocr cake',
      'ocr https://cdn.notsobot.com/brands/notsobot.png',
    ],
    type: CommandTypes.TOOLS,
    usage: 'ocr ?<emoji,user:id|mention|name,url> (-noembed) (-files.gg)',
  };
  type = Parameters.lastImageUrl;

  async run(context: Command.Context, args: CommandArgs) {
    const { annotation } = await googleContentVisionOCR(context, {url: args.url});

    let description: string = '';
    if (annotation) {
      if (2000 < annotation.description.length && args.upload) {
        try {
          const upload = await context.rest.request({
            files: [{filename: 'ocr.txt', key: 'file', value: annotation.description}],
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
      const embed = createUserEmbed(context.user);
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
