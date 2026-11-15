import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVFlagBeninCommand } from './benin';
import { MediaIVFlagBurkinaFasoCommand } from './burkinafaso';
import { MediaIVFlagCapeVerdeCommand } from './capeverde';
import { MediaIVFlagGambiaCommand } from './gambia';
import { MediaIVFlagGhanaCommand } from './ghana';
import { MediaIVFlagGuineaCommand } from './guinea';
import { MediaIVFlagGuineaBissauCommand } from './guineabissau';
import { MediaIVFlagIvoryCoastCommand } from './ivorycoast';
import { MediaIVFlagLiberiaCommand } from './liberia';
import { MediaIVFlagMaliCommand } from './mali';
import { MediaIVFlagMauritaniaCommand } from './mauritania';
import { MediaIVFlagNigerCommand } from './niger';
import { MediaIVFlagNigeriaCommand } from './nigeria';
import { MediaIVFlagSenegalCommand } from './senegal';
import { MediaIVFlagSierraLeoneCommand } from './sierraleone';
import { MediaIVFlagTogoCommand } from './togo';


export class MediaIVFlagAfricaWestGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'West African Flag Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv_flag_africa.west.description');
  name = 'west';
  nameLocalizations = I18n.localizations('commands.media_iv_flag_africa.west.name');

  constructor() {
    super({
      options: [
        new MediaIVFlagBeninCommand(),
        new MediaIVFlagBurkinaFasoCommand(),
        new MediaIVFlagCapeVerdeCommand(),
        new MediaIVFlagGambiaCommand(),
        new MediaIVFlagGhanaCommand(),
        new MediaIVFlagGuineaCommand(),
        new MediaIVFlagGuineaBissauCommand(),
        new MediaIVFlagIvoryCoastCommand(),
        new MediaIVFlagLiberiaCommand(),
        new MediaIVFlagMaliCommand(),
        new MediaIVFlagMauritaniaCommand(),
        new MediaIVFlagNigerCommand(),
        new MediaIVFlagNigeriaCommand(),
        new MediaIVFlagSenegalCommand(),
        new MediaIVFlagSierraLeoneCommand(),
        new MediaIVFlagTogoCommand(),
      ],
    });
  }
}
