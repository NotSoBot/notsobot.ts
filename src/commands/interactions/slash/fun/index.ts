import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { B1Command } from './b1';
import { BadMemeCommand } from './badmeme';
import { EmojiCommand } from './emoji';
import { TTSCommand } from './tts';


export default class FunGroupCommand extends BaseSlashCommand {
  description = 'Fun Commands';
  name = 'fun';

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  constructor() {
    super({
      permissions: [Permissions.ATTACH_FILES],
      options: [
        new B1Command(),
        new BadMemeCommand(),
        new EmojiCommand(),
        new TTSCommand(),
      ],
    });
  }
}
