import { Command, Interaction } from 'detritus-client';

import { MATH_ERROR_TIMEOUT_MESSAGE, MathWorker, displayReply } from '../../../utils';
import { getTranslator } from '../../i18n';


export const COMMAND_ID = 'tools.math';

export interface CommandArgs {
  equation: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const { equation } = args;
  const mathWorker = new MathWorker();

  let content = '';
  try {
    content = await mathWorker.evaluate(equation);
  } catch(error) {
    if (error.message.includes(MATH_ERROR_TIMEOUT_MESSAGE)) {
      content = translate('tools_math.math_equation_timed_out');
    } else {
      content = translate('tools_math.math_equation_errored_out', {message: error.message});
    }
  }

  return displayReply(context, {description: content});
}
