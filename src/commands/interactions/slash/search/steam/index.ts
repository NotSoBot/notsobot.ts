import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { SearchSteamCommunityCommand } from './steam.community';
import { SearchSteamEmojisCommand } from './steam.emojis';
import { SearchSteamProfilesCommand } from './steam.profiles';


export class SearchSteamGroupCommand extends BaseInteractionCommandOptionGroup {
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
