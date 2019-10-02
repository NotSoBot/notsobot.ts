import {
  Command,
  Constants,
  Utils,
} from 'detritus-client';

const { Markup } = Utils;

import { CommandTypes, EmbedBrands, EmbedColors } from '../constants';


export interface CommandArgs {
  code: string,
  jsonspacing: number,
  noembed: boolean,
  noreply: boolean,
  upload: boolean,
}

export default (<Command.CommandOptions> {
  name: 'eval',
  args: [
    {default: 2, name: 'jsonspacing', type: Number},
    {name: 'noembed', type: Boolean},
    {name: 'noreply', type: Boolean},
    {name: 'files.gg', label: 'upload', type: Boolean},
  ],
  label: 'code',
  metadata: {
    description: 'Eval some code',
    examples: [
      'eval context.client.token',
    ],
    type: CommandTypes.OWNER,
    usage: 'eval <code> (-jsonspacing <number>) (-noembed) (-noreply) (-files.gg)',
  },
  type: (value) => {
    const { matches } = Utils.regex(Constants.DiscordRegexNames.TEXT_CODEBLOCK, value);
    if (matches.length) {
      return matches[0].text;
    }
    return value;
  },
  responseOptional: true,
  onBefore: (context) => context.user.isClientOwner,
  run: async (context, args: CommandArgs) => {
    const { code } = args;

    let language = 'js';
    let message: any;
    let errored: boolean = false;
    try {
      message = await Promise.resolve(eval(code));
      if (typeof(message) === 'object') {
        message = JSON.stringify(message, null, args.jsonspacing);
        language = 'json';
      }
    } catch(error) {
      message = (error) ? error.stack || error.message : error;
      errored = true;
    }

    if (!args.noreply) {
      let content: string;
      if (args.upload) {
        try {
          const upload = await context.rest.request({
            files: [{filename: `eval.${language}`, data: message, name: 'file'}],
            method: 'post',
            url: 'https://api.files.gg/files',
          });

          return context.editOrReply(upload.urls.main);
        } catch(error) {
          content = error.stack || error.message;
          language = 'js';
          errored = true;
        }
      } else {
        content = String(message);
      }

      if (!args.noembed) {
        const channel = context.channel;
        if (channel && channel.canEmbedLinks) {
          const embed = new Utils.Embed();
          if (errored) {
            embed.setColor(EmbedColors.ERROR);
          } else {
            embed.setColor(EmbedColors.DEFAULT);
          }
          embed.setDescription(Markup.codeblock(content, {language, mentions: false}));
          embed.setFooter('Eval', EmbedBrands.NOTSOBOT);

          return context.editOrReply({embed});
        }
      }
      return context.editOrReply(Markup.codeblock(content, {language}));
    }
  },
  onError: (context, args, error) => console.error(error),
});
