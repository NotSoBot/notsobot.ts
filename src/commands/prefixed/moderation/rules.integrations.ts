import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, GuildPrefixCommandPermissions, StatusEmojis } from '../../../constants';
import { Formatter, I18n, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'rules integrations';

// off / commands / all, plus on (all) and the default's other names
const VALUES: Record<string, GuildPrefixCommandPermissions> = Object.freeze({
  disable: GuildPrefixCommandPermissions.OFF,
  disabled: GuildPrefixCommandPermissions.OFF,
  false: GuildPrefixCommandPermissions.OFF,
  no: GuildPrefixCommandPermissions.OFF,
  none: GuildPrefixCommandPermissions.OFF,
  off: GuildPrefixCommandPermissions.OFF,
  command: GuildPrefixCommandPermissions.COMMANDS,
  commands: GuildPrefixCommandPermissions.COMMANDS,
  default: GuildPrefixCommandPermissions.COMMANDS,
  single: GuildPrefixCommandPermissions.COMMANDS,
  all: GuildPrefixCommandPermissions.ALL,
  everything: GuildPrefixCommandPermissions.ALL,
  on: GuildPrefixCommandPermissions.ALL,
});

export default class RulesIntegrationsCommand extends BaseCommand {
  // NotSoBot's owners don't skip the member permissions here, it can wreck a server
  permissionsIgnoreClientOwner = false;

  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['rules integration'],
      disableDm: true,
      label: 'value',
      metadata: {
        category: CommandCategories.SERVER,
        description: 'Pick which of the server\'s Integrations command permissions prefix commands follow: off, commands (the ones on single commands, the default) or all, leave empty to see it',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} all`,
          `${COMMAND_NAME} off`,
        ],
        id: Formatter.Commands.ModerationRulesIntegrations.COMMAND_ID,
        usage: '(off|commands|all)',
      },
      permissions: [Permissions.ADMINISTRATOR],
      type: (value: string) => {
        const text = value.trim().toLowerCase();
        if (!text) {
          return null;
        }
        return (text in VALUES) ? VALUES[text] : undefined;
      },
    });
  }

  onBeforeRun(context: Command.Context, args: {value?: GuildPrefixCommandPermissions | null}) {
    return args.value !== undefined;
  }

  async onCancelRun(context: Command.Context) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('rules.integrations.needs_value')}`});
  }

  async run(context: Command.Context, args: {value: GuildPrefixCommandPermissions | null}) {
    return Formatter.Commands.ModerationRulesIntegrations.createMessage(context, {mode: args.value});
  }
}
