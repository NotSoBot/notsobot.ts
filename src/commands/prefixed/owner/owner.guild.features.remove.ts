import { Command, CommandClient, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { removeGuildFeature } from '../../../api';
import { CommandCategories, GuildFeatures } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { DefaultParameters, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'owner guild features remove';

export interface CommandArgsBefore {
  feature: GuildFeatures,
  guild?: Structures.Guild,
}

export interface CommandArgs {
  feature: GuildFeatures,
  guild: Structures.Guild,
}

export default class OwnerGuildFeaturesRemoveCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.OWNER,
        description: 'Remove a feature from the current guild',
        examples: [
          `${COMMAND_NAME} FREE_CUSTOM_COMMANDS`,
        ],
        id: 'owner.guild.features.remove',
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

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.guild;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (!args.guild) {
      return editOrReply(context, '⚠ Couldn\'t find that guild.');
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { features } = await removeGuildFeature(context, args.guild.id, args.feature);
    if (GuildSettingsStore.has(args.guild.id)) {
      GuildSettingsStore.get(args.guild.id)!.merge({features});
    }

    const feature = Markup.codestring(args.feature);
    const featuresText = features.map((x) => Markup.codestring(x)).join(', ');
    return editOrReply(context, `Ok, remove ${feature} from guild \`${args.guild.id}\`. Features are now ${featuresText || 'Empty'}`);
  }
}
