import { Command, Interaction } from 'detritus-client';

import { getTranslator } from '../../i18n';

import { deleteUserLLMMemory } from '../../../api';
import { StatusEmojis } from '../../../constants';
import { displayReply } from '../../../utils';


export const COMMAND_ID = 'settings.ai.memory.forget';

export interface CommandArgs {
  position: number,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);

  const unknownMemory = () => displayReply(context, {
    description: `${StatusEmojis.WARNING} ${translate('settings_ai_memory.unknown_memory')}`,
    ephemeral: true,
  });

  // prefixed commands can give anything here
  if (!Number.isInteger(args.position) || args.position < 1) {
    return unknownMemory();
  }

  try {
    await deleteUserLLMMemory(context, context.userId, args.position);
  } catch(error) {
    if (error.response && error.response.status === 404) {
      return unknownMemory();
    }
    throw error;
  }

  return displayReply(context, {
    description: translate('settings_ai_memory.forgot_memory', {position: args.position}),
    ephemeral: true,
  });
}
