import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVTunnelCommand } from '../../media-iv-2/fun/tunnel';


// overflow for the /media-iv, /media-iv-2 and /media-iv-3 `fun` groups, which are all at discord's 25 subcommand limit
// (tunnel was never registered because of that)
export class MediaFun5GroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'fun';
  nameLocalizations = I18n.localizations('commands.media_iv_2.fun.name');

  constructor() {
    super({
      options: [
        new MediaIVTunnelCommand(),
      ],
    });
  }
}
