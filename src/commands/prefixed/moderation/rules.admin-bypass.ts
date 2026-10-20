import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'rules admin-bypass';

const VALUES: Record<string, boolean> = Object.freeze({
  disable: false,
  disabled: false,
  false: false,
  no: false,
  off: false,
  enable: true,
  enabled: true,
  on: true,
  true: true,
  yes: true,
});

export default class RulesAdminBypassCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['rules adminbypass'],
      disableDm: true,
      label: 'value',
      metadata: {
        category: CommandCategories.SERVER,
        description: 'Set if the server owner and admins skip the rules (on by default), leave empty to see it',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} off`,
        ],
        id: Formatter.Commands.ModerationRulesAdminBypass.COMMAND_ID,
        usage: '(on|off)',
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

  onBeforeRun(context: Command.Context, args: {value?: boolean | null}) {
    return args.value !== undefined;
  }

  async onCancelRun(context: Command.Context) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('rules.admin_bypass.needs_value')}`});
  }

  async run(context: Command.Context, args: {value: boolean | null}) {
    return Formatter.Commands.ModerationRulesAdminBypass.createMessage(context, {enabled: args.value});
  }
}
