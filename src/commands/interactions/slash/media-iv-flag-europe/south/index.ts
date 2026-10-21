import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVFlagAlbaniaCommand } from './albania';
import { MediaIVFlagAndorraCommand } from './andorra';
import { MediaIVFlagBosniaCommand } from './bosnia';
import { MediaIVFlagCroatiaCommand } from './croatia';
import { MediaIVFlagGreeceCommand } from './greece';
import { MediaIVFlagItalyCommand } from './italy';
import { MediaIVFlagKosovoCommand } from './kosovo';
import { MediaIVFlagMaltaCommand } from './malta';
import { MediaIVFlagMontenegroCommand } from './montenegro';
import { MediaIVFlagNorthMacedoniaCommand } from './northmacedonia';
import { MediaIVFlagPortugalCommand } from './portugal';
import { MediaIVFlagSanMarinoCommand } from './sanmarino';
import { MediaIVFlagSerbiaCommand } from './serbia';
import { MediaIVFlagSloveniaCommand } from './slovenia';
import { MediaIVFlagSpainCommand } from './spain';
import { MediaIVFlagVaticanCommand } from './vatican';


export class MediaIVFlagEuropeSouthGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Southern European Flag Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv_flag_europe.south.description');
  name = 'south';
  nameLocalizations = I18n.localizations('commands.media_iv_flag_europe.south.name');

  constructor() {
    super({
      options: [
        new MediaIVFlagAlbaniaCommand(),
        new MediaIVFlagAndorraCommand(),
        new MediaIVFlagBosniaCommand(),
        new MediaIVFlagCroatiaCommand(),
        new MediaIVFlagGreeceCommand(),
        new MediaIVFlagItalyCommand(),
        new MediaIVFlagKosovoCommand(),
        new MediaIVFlagMaltaCommand(),
        new MediaIVFlagMontenegroCommand(),
        new MediaIVFlagNorthMacedoniaCommand(),
        new MediaIVFlagPortugalCommand(),
        new MediaIVFlagSanMarinoCommand(),
        new MediaIVFlagSerbiaCommand(),
        new MediaIVFlagSloveniaCommand(),
        new MediaIVFlagSpainCommand(),
        new MediaIVFlagVaticanCommand(),
      ],
    });
  }
}
