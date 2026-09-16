import { collection, getCountFromServer, getAggregateFromServer, sum, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import type { DashboardSummary } from '../types';
import { queryDocs, orderBy, limit } from './firestoreHelpers';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export const dashboardApi = {
  async summary(): Promise<DashboardSummary> {
    const patientsCol = collection(db, 'patients');
    const treatmentsCol = collection(db, 'treatments');
    const paymentsCol = collection(db, 'payments');

    const today = todayStr();

    const [
      totalPatientsSnap,
      todayTreatmentsSnap,
      completedTreatmentsSnap,
      pendingVerificationSnap,
      pendingBalanceAgg,
      todayRevenueAgg,
      recentPatients,
      recentActivity,
    ] = await Promise.all([
      getCountFromServer(patientsCol),
      getCountFromServer(query(treatmentsCol, where('visit_date', '==', today))),
      getCountFromServer(query(treatmentsCol, where('status', '==', 'completed'))),
      getCountFromServer(query(paymentsCol, where('status', '==', 'pending'))),
      getAggregateFromServer(query(paymentsCol, where('status', '==', 'pending')), { total: sum('balance') }),
      getAggregateFromServer(query(paymentsCol, where('status', '==', 'verified'), where('payment_date', '==', today)), { total: sum('amount_paid') }),
      queryDocs<import('../types').Patient>('patients', orderBy('created_at', 'desc'), limit(5)),
      queryDocs<import('../types').AuditLogEntry>('audit_logs', orderBy('created_at', 'desc'), limit(10)),
    ]);

    return {
      totalPatients: totalPatientsSnap.data().count,
      todayTreatments: todayTreatmentsSnap.data().count,
      completedTreatments: completedTreatmentsSnap.data().count,
      pendingVerification: pendingVerificationSnap.data().count,
      pendingBalance: pendingBalanceAgg.data().total || 0,
      todayRevenue: todayRevenueAgg.data().total || 0,
      recentPatients,
      recentActivity,
    };
  },
};
