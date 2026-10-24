import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class MusicDjRoleCommand extends BaseInteractionCommandOption {
  description = 'Pick the DJ role, or leave empty to see it (or make a NotSoMusic one)';
  metadata = {
    id: Formatter.Commands.MusicDj.COMMAND_ID_ROLE,
  };
  name = 'role';

  constructor() {
    super({
      options: [
        {name: 'role', description: 'The role that makes people DJs', type: ApplicationCommandOptionTypes.ROLE},
        {name: 'none', description: 'Forget the picked role (roles named NotSoMusic count again)', type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: {none?: boolean, role?: Structures.Role}) {
    return Formatter.Commands.MusicDj.createRoleMessage(context, {clear: !!args.none, role: args.role || null});
  }
}
