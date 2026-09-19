/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FirestoreTenantRepository,
  FirestoreRecordRepository,
  FirestoreConfigSnapshotRepository,
  FirestoreSequenceRepository,
  FirestoreAuditRepository,
  FirestoreUserRepository,
  FirestoreBookingRepository,
  FirestoreBackupRepository,
  FirestoreFleetRepository,
  FirestoreNotificationChannel,
} from './adapters/firestore/FirestoreStore.ts';
import { LocalAuthProvider } from './adapters/local/LocalStore.ts';
import {
  TenantRepository,
  RecordRepository,
  ConfigSnapshotRepository,
  SequenceRepository,
  AuditRepository,
  UserRepository,
  BookingRepository,
  AuthProvider,
  BackupRepository,
  FleetRepository,
  NotificationChannel,
} from '../types/ports.ts';

// Container providing active repository ports backed by Firebase Firestore
export interface DataPorts {
  tenants: TenantRepository;
  records: RecordRepository;
  snapshots: ConfigSnapshotRepository;
  sequences: SequenceRepository;
  audit: AuditRepository;
  users: UserRepository;
  booking: BookingRepository;
  auth: AuthProvider;
  backup: BackupRepository;
  fleet: FleetRepository;
  notifications: NotificationChannel;
}

export const defaultPorts: DataPorts = {
  tenants: new FirestoreTenantRepository(),
  records: new FirestoreRecordRepository(),
  snapshots: new FirestoreConfigSnapshotRepository(),
  sequences: new FirestoreSequenceRepository(),
  audit: new FirestoreAuditRepository(),
  users: new FirestoreUserRepository(),
  booking: new FirestoreBookingRepository(),
  auth: new LocalAuthProvider(),
  backup: new FirestoreBackupRepository(),
  fleet: new FirestoreFleetRepository(),
  notifications: new FirestoreNotificationChannel(),
};
