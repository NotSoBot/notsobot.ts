import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { createVoiceClone } from '../../../api';

import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'voice.clone';

export interface CommandArgs {
  name?: string,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const voice = await createVoiceClone(context, args);
  return editOrReply(context, `Cloned voice ${Markup.codestring(voice.name)} successfully.`);
}
