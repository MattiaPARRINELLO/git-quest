import type { ExecuteResult, ParsedCommand, RepoState } from '../types';
import { gitInit } from './init';
import { gitStatus } from './status';
import { gitAdd } from './add';
import { gitCommit } from './commit';
import { gitLog } from './log';
import { gitBranch } from './branch';
import { gitSwitch } from './switch';
import { gitCheckout } from './checkout';
import { gitMerge } from './merge';
import { gitWorktree } from './worktree';
import { gitRm } from './rm';
import { shellCat, shellCd, shellEdit, shellLs, shellRm, shellTouch } from './shell';

type Handlers = {
  [K in ParsedCommand['kind']]: (
    state: RepoState,
    command: Extract<ParsedCommand, { kind: K }>,
  ) => ExecuteResult;
};

const handlers: Handlers = {
  'git-init': gitInit,
  'git-status': gitStatus,
  'git-add': gitAdd,
  'git-commit': gitCommit,
  'git-log': gitLog,
  'git-branch': gitBranch,
  'git-switch': gitSwitch,
  'git-checkout': gitCheckout,
  'git-merge': gitMerge,
  'git-worktree': gitWorktree,
  'git-rm': gitRm,
  'shell-touch': shellTouch,
  'shell-edit': shellEdit,
  'shell-rm': shellRm,
  'shell-cat': shellCat,
  'shell-ls': (state) => shellLs(state),
  'shell-cd': shellCd,
};

export function dispatch(state: RepoState, command: ParsedCommand): ExecuteResult {
  const handler = handlers[command.kind] as (
    state: RepoState,
    command: ParsedCommand,
  ) => ExecuteResult;
  return handler(state, command);
}
