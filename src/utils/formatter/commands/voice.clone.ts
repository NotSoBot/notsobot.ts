import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { createVoiceClone } from '../../../api';
import { getTranslator } from '../../i18n';

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
  const { language, translate, translateMaybe } = await getTranslator(context);
  const voice = await createVoiceClone(context, args);
  return editOrReply(context, translate('voice_clone.cloned_voice_successfully', {name: Markup.codestring(voice.name)}));
}
