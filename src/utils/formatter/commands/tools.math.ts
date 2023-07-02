import { runInNewContext } from 'vm';

import { Command, Interaction } from 'detritus-client';
import * as mathjs from 'mathjs';

import { editOrReply } from '../../../utils';


export const ERROR_TIMEOUT_MESSAGE = 'Script execution timed out after';
export const MAX_TIME_MATH = 25;

export const COMMAND_ID = 'tools.math';

export interface CommandArgs {
  equation: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { equation } = args;
  const parser = mathjs.parser();

  let content = '';
  try {
    content = String(runInNewContext(
      `parser.evaluate(equation)`,
      {equation, parser},
      {timeout: MAX_TIME_MATH},
    ));
  } catch(error) {
    if (error.message.includes(ERROR_TIMEOUT_MESSAGE)) {
      content = 'Math equation timed out';
    } else {
      content = `Math equation errored out (${error.message})`;
    }
  }

  return editOrReply(context, {content});
}
