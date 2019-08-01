import { NotSoClient } from './client';

const client = new NotSoClient({
  cache: {
    applications: {enabled: false},
    members: {enabled: false},
    users: {enabled: false},
  },
  directory: './commands',
  gateway: {guildSubscriptions: false},
  prefix: '!!!',
});

(async () => {
  await client.run({applications: false});
})();
