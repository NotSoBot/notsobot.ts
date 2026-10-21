import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { AestheticsCommand } from './aesthetics';
import { AgarCommand } from './agar';
import { AgarifyCommand } from './agarify';
import { AsciiFromImageCommand } from './ascii-from-image';
import { AsciiFromTextCommand } from './ascii-from-text';
import { B1Command } from './b1';
import { BadMemeCommand } from './badmeme';
import { EmojiCommand } from './emoji';
import { RegionalCommand } from './regional';
import { ReverseTextCommand } from './reverse-text';
import { TextwallCommand } from './textwall';
import { TTSCommand } from './tts';
import { XDCommand } from './xd';
import { ZalgoCommand } from './zalgo';


export default class FunGroupCommand extends BaseSlashCommand {
  description = 'Text and emoji fun: zalgo, text walls, TTS and more';
  descriptionLocalizations = I18n.localizations('commands.fun.description');
  name = 'fun';
  nameLocalizations = I18n.localizations('commands.fun.name');

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
        new AestheticsCommand(),
        new AgarCommand(),
        new AgarifyCommand(),
        new AsciiFromImageCommand(),
        new AsciiFromTextCommand(),
        new B1Command(),
        new BadMemeCommand(),
        new EmojiCommand(),
        new RegionalCommand(),
        new ReverseTextCommand(),
        new TextwallCommand(),
        new TTSCommand(),
        new XDCommand(),
        new ZalgoCommand(),
      ],
    });
  }
}
