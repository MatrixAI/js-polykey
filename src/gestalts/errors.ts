import { ErrorPolykey } from '../errors';

class ErrorGestalts extends ErrorPolykey {}

class ErrorGestaltsGraphNotStarted extends ErrorGestalts {}

class ErrorGestaltsGraphNodeIdMissing extends ErrorGestalts {}

class ErrorGestaltsGraphIdentityIdMissing extends ErrorGestalts {}

class ErrorGestaltsInvalidAction extends ErrorGestalts {}

export {
  ErrorGestalts,
  ErrorGestaltsGraphNotStarted,
  ErrorGestaltsGraphNodeIdMissing,
  ErrorGestaltsGraphIdentityIdMissing,
  ErrorGestaltsInvalidAction,
};
