import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, GuildFeatures } from '../../../constants';
import { DefaultParameters, Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'owner guild features add';

export default class OwnerGuildFeaturesAddCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.OWNER,
        description: 'Add a feature to the current guild',
        examples: [
          `${COMMAND_NAME} FREE_CUSTOM_COMMANDS`,
        ],
        id: Formatter.Commands.OwnerGuildFeaturesAdd.COMMAND_ID,
        usage: '<feature> ?<guild:id>',
      },
      type: [
        {
          name: 'feature',
          choices: Object.values(GuildFeatures),
          help: `Must be one of (${Object.values(GuildFeatures).join(', ')})`,
          type: (value: string) => value.toUpperCase(),
        },
        {name: 'guild', default: DefaultParameters.guild, type: Parameters.guild},
      ],
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.OwnerGuildFeaturesAdd.CommandArgsBefore) {
    return !!args.guild;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.OwnerGuildFeaturesAdd.CommandArgsBefore) {
    if (!args.guild) {
      return editOrReply(context, '⚠ Couldn\'t find that guild.');
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.OwnerGuildFeaturesAdd.CommandArgs) {
    return Formatter.Commands.OwnerGuildFeaturesAdd.createMessage(context, args);
  }
}
