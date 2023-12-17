import { spawnSync } from 'node:child_process';

export function getProjectRoot(): string[] {
  const { error, stdout } = spawnSync(
        `git worktree list --porcelain`,
        {
          encoding: 'utf8',
          shell: true,
        },
  );

  if (!stdout)
    throw new Error('Unable to use git to find project root.', error);

  return stdout
    .split('\n')
    .map((line) => {
      const [key, value] = line.split(/\s+/) || [];
      return key === 'worktree' ? value : '';
    })
    .filter(Boolean);
};
