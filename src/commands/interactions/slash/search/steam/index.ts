import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { SearchSteamCommunityCommand } from './steam.community';
import { SearchSteamEmojisCommand } from './steam.emojis';
import { SearchSteamProfileCommand } from './steam.profile';


export class SearchSteamGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'steam';

  constructor() {
    super({
      options: [
        new SearchSteamCommunityCommand(),
        new SearchSteamEmojisCommand(),
        new SearchSteamProfileCommand(),
      ],
    });
  }
}
