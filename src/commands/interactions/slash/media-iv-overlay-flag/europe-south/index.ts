import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVFlagAlbaniaCommand } from './albania';
import { MediaIVFlagAndorraCommand } from './andorra';
import { MediaIVFlagBosniaCommand } from './bosnia';
import { MediaIVFlagCroatiaCommand } from './croatia';
import { MediaIVFlagCyprusCommand } from './cyprus';
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
import { MediaIVFlagTurkeyCommand } from './turkey';
import { MediaIVFlagVaticanCommand } from './vatican';


export class MediaIVOverlayFlagEuropeSouthGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Southern European Flag Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv_overlay_flag.europe_south.description');
  name = 'europe-south';
  nameLocalizations = I18n.localizations('commands.media_iv_overlay_flag.europe_south.name');

  constructor() {
    super({
      options: [
        new MediaIVFlagAlbaniaCommand(),
        new MediaIVFlagAndorraCommand(),
        new MediaIVFlagBosniaCommand(),
        new MediaIVFlagCroatiaCommand(),
        new MediaIVFlagCyprusCommand(),
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
        new MediaIVFlagTurkeyCommand(),
        new MediaIVFlagVaticanCommand(),
      ],
    });
  }
}
