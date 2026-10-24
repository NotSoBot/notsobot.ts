import { Command, CommandClient, Structures } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'music dj role';

type Value = {clear: true} | {role: Structures.Role} | {};

export default class MusicDjRoleCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      label: 'value',
      metadata: {
        description: 'Pick the role that makes people DJs (it controls the music with DJ mode on), `none` forgets it. Nothing given shows it, or makes the DJ role (no permissions, at the bottom) and picks that. Picking needs Manage Server, making one Manage Roles',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} @DJ`,
          `${COMMAND_NAME} none`,
        ],
        category: CommandCategories.MUSIC,
        id: Formatter.Commands.MusicDj.COMMAND_ID_ROLE,
        usage: '(<role:id|mention|name>|none)',
      },
      // undefined when it's neither a role nor none
      type: (value: string, context: Command.Context): Value | undefined => {
        const text = value.trim();
        if (!text) {
          return {};
        }
        if (['clear', 'none', 'off', 'reset'].includes(text.toLowerCase())) {
          return {clear: true};
        }
        const role = Parameters.role(text, context);
        return (role) ? {role} : undefined;
      },
    });
  }

  onBeforeRun(context: Command.Context, args: {value?: Value}) {
    return args.value !== undefined;
  }

  async onCancelRun(context: Command.Context) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_dj.role_needs_value')}`});
  }

  async run(context: Command.Context, args: {value: Value}) {
    return Formatter.Commands.MusicDj.createRoleMessage(context, args.value);
  }
}
