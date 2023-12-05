import { Command, Interaction, Structures } from 'detritus-client';

import { mediaICreateRetrowave } from '../../../api';
import { RestOptions } from '../../../api/types';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'media.i.create.retrowave';

export interface CommandArgs {
  background?: number,
  text: string,
  textStyle?: number,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  let parts: Array<string>;
  if (args.text.includes('|')) {
    parts = args.text.split('|');
  } else {
    if (15 <= args.text.length) {
      parts = [];
      for (let i = 0; i < args.text.length; i += 15) {
        parts.push(args.text.slice(i, i + 15));
      }
    } else {
      const split = args.text.split(' ');
      if (split.length === 1) {
        parts = ['', split[0]];
      } else if (1 < split.length && split.length <= 3) {
        parts = split;
      } else {
        parts = args.text.split('');
        if (parts.length === 4) {
          parts[2] = parts[2] + parts.pop()!;
        }
      }
    }
  }

  if (context instanceof Command.Context) {
    for (let i in parts) {
      parts[i] = Structures.messageSystemContent(context.message, parts[i]!);
    }
  }

  const query: RestOptions.MediaICreateRetrowave = {
    background: args.background,
    line1: '',
    line2: '',
    line3: '',
    textStyle: args.textStyle,
  };

  for (let i = 0; i < Math.min(parts.length, 3); i++) {
    (query as any)[`line${i + 1}`] = parts[i];
  }

  const response = await mediaICreateRetrowave(context, query);
  return imageReply(context, response);
}
