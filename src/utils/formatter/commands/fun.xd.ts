import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { displayReply } from '../../../utils';


export const COMMAND_ID = 'fun.xd';

export const MAX_WORDS = 3;
export const MAX_WORD_LENGTH = 10;

export interface CommandArgs {
  text: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  // draws a big "XD", the first word makes the X and the D's two sides are the second and third words (or the first again)
  const words = args.text.split(/\s+/).filter((x) => x).slice(0, MAX_WORDS).map((x) => Array.from(x).slice(0, MAX_WORD_LENGTH).join(''));
  while (words.length < MAX_WORDS) {
    words.push(words[0]);
  }
  const [x, y, z] = words;

  // the X's middle row (and the gap after it) shift with the first word's length so the X stays centered
  const length = Array.from(x).length;
  let premiddle = 7;
  let middle = 11;
  if (length === 1) {
    premiddle = 6;
    middle = 10;
  } else if (length === 2) {
    middle = 10;
  } else if (3 < length) {
    premiddle += Math.floor((length - 3) / 3) + 1;
    middle += Math.floor((length - 3) / 2.2 + 0.5);
    if (length === 10) {
      premiddle += 1;
    }
  }

  const content = [
    `${x}           ${x}    ${y} ${z}`,
    `  ${x}       ${x}      ${y}    ${z}`,
    `    ${x}   ${x}        ${y}     ${z}`,
    `${' '.repeat(premiddle)}${x}${' '.repeat(middle)}${y}     ${z}`,
    `    ${x}   ${x}        ${y}     ${z}`,
    `  ${x}       ${x}      ${y}    ${z}`,
    `${x}           ${x}    ${y} ${z}`,
  ].join('\n');
  return displayReply(context, {description: Markup.codeblock(content)});
}
