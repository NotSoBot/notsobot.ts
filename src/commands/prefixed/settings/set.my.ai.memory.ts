import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'set my ai memory';

const VALUES_ON = ['on', 'true', 'yes', 'enable', 'enabled'];
const VALUES_OFF = ['off', 'false', 'no', 'disable', 'disabled'];

export default class SetMyAIMemoryCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'enabled',
      metadata: {
        category: CommandCategories.PERSONAL,
        description: 'Turn NotSoAI\'s memory of you on or off',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} off`,
        ],
        id: Formatter.Commands.SettingsSetAIMemory.COMMAND_ID,
        usage: '?<on|off>',
      },
      // nothing shows the current setting
      type: (value: string): boolean | undefined => {
        value = value.trim().toLowerCase();
        if (!value) {
          return undefined;
        }
        if (VALUES_ON.includes(value)) {
          return true;
        }
        if (VALUES_OFF.includes(value)) {
          return false;
        }
        throw new Error('Must be `on` or `off`');
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SettingsSetAIMemory.CommandArgs) {
    return Formatter.Commands.SettingsSetAIMemory.createMessage(context, args);
  }
}
