import * as migration_20260913_151917_online_writing from './20260913_151917_online_writing';

export const migrations = [
  {
    up: migration_20260913_151917_online_writing.up,
    down: migration_20260913_151917_online_writing.down,
    name: '20260913_151917_online_writing'
  },
];
