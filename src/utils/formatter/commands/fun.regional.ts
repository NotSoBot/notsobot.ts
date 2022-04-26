import { Command, Interaction } from 'detritus-client';

import { ZERO_WIDTH_SPACE } from '../../../constants';
import { editOrReply } from '../../../utils';


const REGIONAL_CHARACTERS = {"z": "\ud83c\uddff", "y": "\ud83c\uddfe", "x": "\ud83c\uddfd", "w": "\ud83c\uddfc", "v": "\ud83c\uddfb", "u": "\ud83c\uddfa", "t": "\ud83c\uddf9", "s": "\ud83c\uddf8", "r": "\ud83c\uddf7", "q": "\ud83c\uddf6", "p": "\ud83c\uddf5", "o": "\ud83c\uddf4", "n": "\ud83c\uddf3", "m": "\ud83c\uddf2", "l": "\ud83c\uddf1", "k": "\ud83c\uddf0", "j": "\ud83c\uddef", "i": "\ud83c\uddee", "h": "\ud83c\udded", "g": "\ud83c\uddec", "f": "\ud83c\uddeb", "e": "\ud83c\uddea", "d": "\ud83c\udde9", "c": "\ud83c\udde8", "b": "\ud83c\udde7", "a": "\ud83c\udde6", "0": "0\u20e3", "1": "1\u20e3", "2": "2\u20e3", "3": "3\u20e3", "4": "4\u20e3", "5": "5\u20e3", "6": "6\u20e3", "7": "7\u20e3", "8": "8\u20e3", "9": "9\u20e3", "10": "\ud83d\udd1f"};

export const COMMAND_ID = 'fun.regional';

export interface CommandArgs {
  text: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  let content = '';

  const text = args.text.toLowerCase();
  for (let i = 0; i < text.length; i++) {
    if (text[i] in REGIONAL_CHARACTERS) {
      content += `${ZERO_WIDTH_SPACE}${(REGIONAL_CHARACTERS as any)[text[i]]}`;
    } else if (text[i] === ' ') {
      content += '  ';
    } else {
      content += text[i];
    }
  }

  return editOrReply(context, content);
}
