import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { displayReply } from '../../../utils';


export const COMMAND_ID = 'fun.zalgo';

// every letter/number gets up to 7 marks, so this keeps the output under discord's text limits
export const MAX_LENGTH = 400;

// the combining diacritical marks block (U+0300..U+036E)
const MARKS = Array.from({length: 879 - 768}, (x, i) => String.fromCharCode(768 + i));

export interface CommandArgs {
  text: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  let content = '';
  for (let character of Markup.escape.all(args.text.slice(0, MAX_LENGTH))) {
    content += character;
    if (/[\p{L}\p{N}]/u.test(character)) {
      for (let i = 2 + Math.floor(Math.random() * 6); 0 < i; i--) {
        content += MARKS[Math.floor(Math.random() * MARKS.length)];
      }
    }
  }
  return displayReply(context, {description: content});
}
