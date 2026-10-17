import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { EmbedBrands, EmbedColors } from '../../../constants';
import { DisplayPayload, displayReply, replaceToken } from '../../../utils';


const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;


export interface CommandArgs {
  async?: boolean,
  code: {language?: string, text: string},
  jsonspacing?: number,
  noreply?: boolean,
  upload?: boolean,
}


export const COMMAND_ID = 'owner.eval';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
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
    if (message === undefined && error && typeof(error) === 'object') {
      // errors passed over ipc can be plain objects without a stack or message
      try {
        message = JSON.stringify(error, null, args.jsonspacing);
      } catch {}
    }
    errored = true;
  }
  // replaceToken needs a string, the code can return/throw anything (including undefined)
  message = String(message);

  if (!args.noreply) {
    let content: string;
    if (args.upload) {
      try {
        message = replaceToken(context, message);
        return await displayReply(context, {files: [{filename: `eval.${language}`, value: message}]});
      } catch(error) {
        content = error.stack || error.message;
        language = 'js';
        errored = true;
      }
    } else {
      content = String(message);
    }

    content = replaceToken(context, content);
    const payload: DisplayPayload = {fields: []};
    if (errored) {
      payload.color = EmbedColors.ERROR;
    } else {
      payload.color = EmbedColors.DEFAULT;
    }
    payload.description = Markup.codeblock(content, {language, mentions: false});
    payload.footer = 'Eval';
    payload.footerIconUrl = EmbedBrands.NOTSOBOT;

    return displayReply(context, payload);
  }
}
