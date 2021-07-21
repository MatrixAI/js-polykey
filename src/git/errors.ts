import { ErrorPolykey } from '../errors';

class ErrorGit extends ErrorPolykey {}

class ErrorRepositoryUndefined extends ErrorGit {}

class ErrorCommit extends ErrorGit {}

class ErrorGitPermissionDenied extends ErrorGit {}

class ErrorGitUndefinedRefs extends ErrorGit {}

class ErrorGitUndefinedFileMode extends ErrorGit {}

class ErrorGitBufferParse extends ErrorGit {}

class ErrorGitType extends ErrorGit {}

class ErrorGitInvalidSha extends ErrorGit {}

export {
  ErrorGit,
  ErrorRepositoryUndefined,
  ErrorCommit,
  ErrorGitPermissionDenied,
  ErrorGitUndefinedRefs,
  ErrorGitUndefinedFileMode,
  ErrorGitBufferParse,
  ErrorGitType,
  ErrorGitInvalidSha,
};
