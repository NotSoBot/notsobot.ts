import { Command, Interaction } from 'detritus-client';

import { utilitiesMLEdit, utilitiesMLImagine } from '../../../api';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'fun.game.imagine';

export interface CommandArgs {
  prompt: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  // generate image based off prompt then create embed asking if people want to join
  // update embed with the people who have joined
  // add button on bottom with the player count (out of 9 cuz of max attachments)
  // when game starts, it will update with a button to press thatll open up the discord form action
  // each form submission will create an ephermal message with their generated image asking if they want to use it
  // a button with Confirm or Cancel will appear under image, pressing cancel will re-open the form
  // pressing the form button on the OG message will cancel their current ongoing submission incase of bugs
  // once everyone submits (30 second timeout?), create new message with all 9 submissions as attachments
  // maybe have a vote at the end with the winner?
  return editOrReply(context, {
    content: 'ok',
  });
}
