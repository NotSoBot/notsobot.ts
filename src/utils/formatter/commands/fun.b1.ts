import { Command, Interaction } from 'detritus-client';

import { CDN } from '../../../api/endpoints';
import { editOrReply } from '../..';


export const COMMAND_ID = 'fun.b1';

export interface CommandArgs {

}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const url = CDN.URL + CDN.COMMAND_ASSETS_B1;
  try {
    const value = await context.rest.get(url);
    return editOrReply(context, {file: {filename: 'b1.png', value}});
  } catch(error) {
    return editOrReply(context, url);
  }
}
