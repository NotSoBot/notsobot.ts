import { Command, CommandClient } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { CommandCategories, EmbedBrands, EmbedColors } from '../../../constants';
import { DefaultParameters, Parameters, editOrReply, replaceToken } from '../../../utils';

import { BaseCommand } from '../basecommand';


const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;


export interface CommandArgs {
  async: boolean,
  code: {language?: string, text: string},
  jsonspacing: number,
  noembed: boolean,
  noreply: boolean,
  upload: boolean,
}


export const COMMAND_NAME = 'eval';

export default class EvalCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'async', type: Boolean},
        {name: 'jsonspacing', default: 2, type: Number},
        {name: 'noembed', default: DefaultParameters.noEmbed, type: () => true},
        {name: 'noreply', type: Boolean},
        {name: 'upload', type: Boolean},
      ],
      label: 'code',
      metadata: {
        description: 'Eval some code ;)',
        examples: [
          `${COMMAND_NAME} context.client.token`,
        ],
        category: CommandCategories.OWNER,
        usage: '<code> (-async) (-jsonspacing <number>) (-noembed) (-noreply) (-upload)',
      },
      responseOptional: true,
      type: Parameters.codeblock,
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
        const func = new AsyncFunction('context', code.text);
        message = await func(context);
      } else {
        message = await Promise.resolve(eval(code.text));
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
          message = replaceToken(context, message);
          return await editOrReply(context, {
            file: {filename: `eval.${language}`, value: message},
          });
        } catch(error) {
          content = error.stack || error.message;
          language = 'js';
          errored = true;
        }
      } else {
        content = String(message);
      }

      content = replaceToken(context, content);
      if (!args.noembed) {
        const embed = new Embed();
        if (errored) {
          embed.setColor(EmbedColors.ERROR);
        } else {
          embed.setColor(EmbedColors.DEFAULT);
        }
        embed.setDescription(Markup.codeblock(content, {language, mentions: false}));
        embed.setFooter('Eval', EmbedBrands.NOTSOBOT);

        return editOrReply(context, {embed});
      }
      return editOrReply(context, Markup.codeblock(content, {language}));
    }
  }
}
