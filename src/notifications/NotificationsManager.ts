import type { NotificationId } from './types';
import type { ACL } from '../acl';
import type { DB } from '../db';
//import type { NodeManager } from '../nodes';
import type { WorkerManager } from '../workers';
import type { DBLevel, DBOp } from '../db/types';
import type { NodeId } from '../nodes/types';
import type { Ref } from '../types';

import { Mutex } from 'async-mutex';
import Logger from '@matrixai/logger';
import * as notificationsUtils from './utils';
import * as notificationsErrors from './errors';
import { errors as dbErrors } from '../db';

/**
 * Manage Node Notifications between Gestalts
 */
class NotificationsManager {
  protected logger: Logger;
  protected acl: ACL;
  protected db: DB;
  //protected nodeManager: NodeManager;
  protected workerManager?: WorkerManager;

  protected readonly MESSAGE_COUNT_KEY: string = 'numMessages';

  protected notificationsDomain: string = this.constructor.name;
  protected notificationsDbDomain: Array<string> = [this.notificationsDomain];
  protected notificationsMessagesDbDomain: Array<string> = [
    this.notificationsDomain,
    'messages',
  ];

  // protected notificationsDbDomain: Array<string> = [this.constructor.name, 'numMessages'];
  // protected notificationsMessagesDbDomain: Array<string> = [this.notificationsDbDomain[0], 'messages'];

  protected notificationsDb: DBLevel<string>;
  protected notificationsMessagesDb: DBLevel<NotificationId>;
  protected lock: Mutex = new Mutex();
  protected _started: boolean = false;

  constructor({
    acl,
    db,
    /*nodeManager,*/ logger,
  }: {
    acl: ACL;
    db: DB;
    /*nodeManager: NodeManager;*/ logger?: Logger;
  }) {
    this.logger = logger ?? new Logger(this.constructor.name);
    this.acl = acl;
    this.db = db;
    //this.nodeManager = nodeManager;
  }

  public async start({
    fresh = false,
  }: {
    fresh?: boolean;
  } = {}): Promise<void> {
    try {
      if (this._started) {
        return;
      }
      this.logger.info('Starting Notifications Manager');
      this._started = true;
      if (!this.db.started) {
        throw new dbErrors.ErrorDBNotStarted();
      }
      // sub-level stores 'numMessages' -> number (of messages)

      const notificationsDb = await this.db.level<string>(
        this.notificationsDomain,
      );
      // const notificationsDb = await this.db.level<string>(
      //   this.notificationsDbDomain[1],
      //   this.db.db,
      // );

      // sub-sub-level stores NotificationId -> string (message)
      const notificationsMessagesDb = await this.db.level<NotificationId>(
        this.notificationsMessagesDbDomain[1],
        notificationsDb,
      );
      if (fresh) {
        await notificationsDb.clear();
      }
      this.notificationsDb = notificationsDb;
      this.notificationsMessagesDb = notificationsMessagesDb;
      this.logger.info('Started Notifications Manager');
    } catch (e) {
      this._started = false;
      throw e;
    }
  }

  async stop() {
    if (!this._started) {
      return;
    }
    this.logger.info('Stopping Notifications Manager');
    this._started = false;
    this.logger.info('Stopped Notifications Manager');
  }

  /**
   * Send a notification

  public async sendMessage(
    nodeId: NodeId,
    message: string,
  ) {
    const nodeAddress = await this.nodeManager.getNode(nodeId);
    if (nodeAddress === undefined) {
      throw new notificationsErrors.ErrorNotificationsNodeNotFound();
    }
    await this.nodeManager.createConnectionToNode(nodeId, nodeAddress);
    const client = this.nodeManager.getClient(nodeId);
    // NodeManager will send message...
  }
   */

  /**
   * Receive a notification
   */
  public async receiveMessage(
    //nodeId: NodeId,
    message: string,
  ) {
    //const nodePerms = await this.acl.getNodePerm(nodeId);
    //if (nodePerms === undefined) {
    //  throw new notificationsErrors.ErrorNotificationsPermissionsNotFound();
    //}
    // Only keep the message if the sending node has the correct permissions
    //if (nodePerms.gestalt.notify) {
    // If the number stored in notificationsDb >= 10000
    let numMessages = await this.db.get<string>(
      this.notificationsDbDomain,
      this.MESSAGE_COUNT_KEY,
    );
    if (numMessages === undefined) {
      numMessages = '0';
      await this.db.put<string>(
        this.notificationsDbDomain,
        this.MESSAGE_COUNT_KEY,
        '0',
      );
    }
    if (+numMessages >= 10000) {
      // Remove the oldest notification from notificationsMessagesDb
      const oldestMessageId = await this.getOldestMessage();
      if (oldestMessageId === undefined) {
        throw new notificationsErrors.ErrorNotificationsDb();
      }
      await this.removeOldestMessage(oldestMessageId, numMessages);
    }
    // Store the new notification in notificationsMessagesDb
    const notificationId = notificationsUtils.generateNotifId();
    await this.db.put<string>(
      this.notificationsMessagesDbDomain,
      notificationId,
      message,
    );
    // Number of messages += 1
    const newNumMessages = +numMessages + 1;
    await this.db.put<string>(
      this.notificationsDbDomain,
      this.MESSAGE_COUNT_KEY,
      newNumMessages.toString(),
    );
    //}
  }

  /**
   * Read a notification
   */
  public async readMessage(): Promise<string | undefined> {
    const oldestMessageId = await this.getOldestMessage();
    if (oldestMessageId === undefined) {
      return undefined;
    }
    const numMessages = await this.db.get<string>(
      this.notificationsDbDomain,
      this.MESSAGE_COUNT_KEY,
    );
    if (numMessages === undefined) {
      return undefined;
    }
    const oldestMessage = await this.db.get<string>(
      this.notificationsMessagesDbDomain,
      oldestMessageId,
    );
    if (oldestMessage === undefined) {
      return undefined;
    }
    await this.removeOldestMessage(oldestMessageId, numMessages);
    return oldestMessage;
  }

  protected async getOldestMessage(): Promise<NotificationId | undefined> {
    const messages: Record<NotificationId, Record<NotificationId, string>> = {};
    for await (const o of this.notificationsMessagesDb.createReadStream()) {
      const notifId = (o as any).key as NotificationId;
      const data = (o as any).value as Buffer;
      const message = this.db.unserializeDecrypt<string>(data);
      let notification: Record<NotificationId, string>;
      if (message in messages) {
        notification = messages[message];
        let msgContents: string;
        for (const notifId_ in notification) {
          msgContents = notification[notifId_];
          break;
        }
        notification[notifId] = msgContents!;
      } else {
        const msgRef = (await this.db.get(
          this.notificationsMessagesDbDomain,
          notifId,
        )) as Ref<string>;
        notification = { [notifId]: msgRef.object };
        messages[message] = notification;
      }
    }
    const notifications: Array<Record<NotificationId, string>> = [];
    for (const message in messages) {
      notifications.push(messages[message]);
    }
    return notifications[0][0];
  }

  protected async removeOldestMessage(
    oldestMessageId: NotificationId,
    numMessages: string,
  ) {
    const ops: Array<DBOp> = [
      {
        type: 'del',
        domain: this.notificationsMessagesDbDomain,
        key: oldestMessageId,
      },
      {
        type: 'put',
        domain: this.notificationsDbDomain,
        key: 'numMessages',
        value: String(+numMessages - 1),
      },
    ];
    await this.db.batch(ops);
  }
}

export default NotificationsManager;
