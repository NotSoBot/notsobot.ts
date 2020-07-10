import { Command, CommandClient, Constants, Utils } from 'detritus-client';
const { Embed, Markup } = Utils;

import { CommandTypes, EmbedBrands, EmbedColors } from '../../constants';

import { BaseCommand } from '../basecommand';


const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;


export interface CommandArgs {
  async: boolean,
  code: string,
  jsonspacing: number,
  noembed: boolean,
  noreply: boolean,
  upload: boolean,
}

export default class EvalCommand extends BaseCommand {
  name = 'eval';

  label = 'code';
  metadata = {
    description: 'Eval some code',
    examples: [
      'eval context.client.token',
    ],
    type: CommandTypes.OWNER,
    usage: 'eval <code> (-jsonspacing <number>) (-noembed) (-noreply) (-files.gg)',
  };
  responseOptional = true;
  type = (value: string) => {
    const { matches } = Utils.regex(Constants.DiscordRegexNames.TEXT_CODEBLOCK, value);
    if (matches.length) {
      return matches[0].text;
    }
    return value;
  };

  constructor(client: CommandClient, options: Command.CommandOptions) {
    super(client, {
      ...options,
      args: [
        {name: 'async', type: Boolean},
        {name: 'jsonspacing', type: Number, default: 2},
        {name: 'noembed', default: (context: Command.Context) => !!(context.channel && !context.channel.canEmbedLinks), type: () => true},
        {name: 'noreply', type: Boolean},
        {name: 'files.gg', label: 'upload', type: Boolean},
      ],
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { code } = args;

    let language = 'js';
    let message: any;
    let errored: boolean = false;
    try {
      if (args.async) {
        const func = new AsyncFunction('context', code);
        message = await func(context);
      } else {
        message = await Promise.resolve(eval(code));
      }
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
            files: [{filename: `eval.${language}`, key: 'file', value: message}],
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
          const embed = new Embed();
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
  }
}
