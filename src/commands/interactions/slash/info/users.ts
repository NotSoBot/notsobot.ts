import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes, MessageFlags } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters, editOrReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgsBefore {
  bots?: boolean,
  hasnick?: boolean,
  role?: Structures.Role,
  users: Array<Structures.Member | Structures.User> | null,
}

export const COMMAND_NAME = 'users';

export class InfoUsersCommand extends BaseInteractionCommandOption {
  description = 'Get information about multiple members/users';
  descriptionLocalizations = I18n.localizations('commands.info.users.description');
  metadata = {
    id: Formatter.Commands.InfoUsers.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.info.users.name');

  constructor() {
    super({
      options: [
        {
          name: 'search',
          description: 'Name, Mention, or ID to search for (Default: Everyone)',
          ...I18n.optionLocalizations('commands.info.users.search'),
          default: DefaultParameters.members,
          label: 'users',
          value: Parameters.membersOrUsersSearch(),
        },
        {
          name: 'bots',
          description: 'Only show bots',
          ...I18n.optionLocalizations('commands.info.users.bots'),
          type: Boolean,
        },
        {
          name: 'has-nick',
          description: 'Only show members with a nickname',
          ...I18n.optionLocalizations('commands.info.users.has_nick'),
          label: 'hasnick',
          type: Boolean,
        },
        {
          name: 'role',
          description: 'Only show members with this role',
          ...I18n.optionLocalizations('commands.info.users.role'),
          type: ApplicationCommandOptionTypes.ROLE,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    return !!args.users && !!args.users.length;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    return editOrReply(context, {
      content: `${StatusEmojis.WARNING} ${translate('info.users.not_found')}`,
      flags: MessageFlags.EPHEMERAL,
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    return Formatter.Commands.InfoUsers.createMessage(context, {
      bots: !!args.bots,
      hasnick: !!args.hasnick,
      role: args.role,
      users: args.users!,
    });
  }
}
