import { Command, Interaction } from 'detritus-client';
import { InteractionCallbackTypes, MessageComponentButtonStyles } from 'detritus-client/lib/constants';
import { ComponentContext, Components } from 'detritus-client/lib/utils';

import { getTranslator } from '../../i18n';

import { deleteUserLLMMemories } from '../../../api';
import { EmbedColors } from '../../../constants';
import { DisplayPayload, displayReply } from '../../../utils';


export const COMMAND_ID = 'settings.ai.memory.clear';

export interface CommandArgs {

}

// asks to confirm with buttons first, it forgets every server's memories too
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate } = await getTranslator(context);

  const payload: DisplayPayload = {
    color: EmbedColors.DEFAULT,
    ephemeral: true,
    title: translate('settings_ai_memory.are_you_sure_you_want_to_clear'),
  };

  const components = new Components({timeout: 5 * (60 * 1000)});
  components.createButton({
    label: translate('settings_ai_memory.continue'),
    style: MessageComponentButtonStyles.DANGER,
    run: async (ctx: ComponentContext) => {
      if (ctx.userId !== context.userId) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      try {
        const response = await deleteUserLLMMemories(context, context.userId);
        payload.color = EmbedColors.LOG_CREATION;
        payload.title = translate('settings_ai_memory.cleared', {count: response.count.toLocaleString(language)});
      } catch(error) {
        payload.color = EmbedColors.ERROR;
        payload.title = translate('settings_ai_memory.clear_errored');
      }
      await displayReply(context, payload, {replyTo: ctx});
    },
  });

  components.createButton({
    label: translate('settings_ai_memory.cancel'),
    style: MessageComponentButtonStyles.SECONDARY,
    run: async (ctx: ComponentContext) => {
      if (ctx.userId !== context.userId) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      payload.color = EmbedColors.ERROR;
      payload.title = translate('settings_ai_memory.clear_cancelled');
      await displayReply(context, payload, {replyTo: ctx});
    },
  });

  const message = await displayReply(context, {...payload, components});
  components.onTimeout = async () => {
    try {
      payload.color = EmbedColors.ERROR;
      payload.title = translate('settings_ai_memory.clear_expired');
      // edits the response for both prefixed commands and interactions
      await displayReply(context, payload);
    } catch(error) {

    }
  };
  return message;
}
