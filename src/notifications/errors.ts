import { ErrorPolykey } from '../errors';

class ErrorNotifications extends ErrorPolykey {}

class ErrorNotificationsNodeNotFound extends ErrorNotifications {}

class ErrorNotificationsPermissionsNotFound extends ErrorNotifications {}

class ErrorNotificationsDb extends ErrorNotifications {}

export {
  ErrorNotifications,
  ErrorNotificationsNodeNotFound,
  ErrorNotificationsPermissionsNotFound,
  ErrorNotificationsDb,
};
