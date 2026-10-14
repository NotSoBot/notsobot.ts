import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationOverlayHalfLifePistol } from '../../../api';
import { getTranslator } from '../../i18n';
import { DefaultParameters, displayReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.overlay.halflife.pistol';
// disabled until Discord Compliance confirms the half-life weapon props are allowed
export const IS_PIPEABLE = false;

export interface CommandArgs {
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationOverlayHalfLifePistol(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  // disabled until Discord Compliance confirms the half-life weapon props are allowed
  const { translate } = await getTranslator(context);
  return displayReply(context, {description: translate('commands.media_iv.overlay.awaiting_compliance')});
}
