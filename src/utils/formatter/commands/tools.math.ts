import { Command, Interaction } from 'detritus-client';

import { MathWorker, MATH_ERROR_TIMEOUT_MESSAGE, editOrReply } from '../../../utils';


export const COMMAND_ID = 'tools.math';

export interface CommandArgs {
  equation: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { equation } = args;
  const mathWorker = new MathWorker();

  let content = '';
  try {
    content = await mathWorker.evaluate(equation);
  } catch(error) {
    if (error.message.includes(MATH_ERROR_TIMEOUT_MESSAGE)) {
      content = 'Math equation timed out';
    } else {
      content = `Math equation errored out (${error.message})`;
    }
  }

  return editOrReply(context, {content});
}
