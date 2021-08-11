import { BaseCommandOptionGroup } from '../../basecommand';

import { SearchSteamCommunityCommand } from './steam.community';
import { SearchSteamEmojisCommand } from './steam.emojis';
import { SearchSteamProfilesCommand } from './steam.profiles';


export class SearchSteamGroupCommand extends BaseCommandOptionGroup {
  description = '.';
  name = 'steam';

  constructor() {
    super({
      options: [
        new SearchSteamCommunityCommand(),
        new SearchSteamEmojisCommand(),
        new SearchSteamProfilesCommand(),
      ],
    });
  }
}
