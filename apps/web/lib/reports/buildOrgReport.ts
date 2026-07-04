/**
 * Server-side org report builder.
 * Builds report rows (level, name, id, memberCount) for a given report config.
 * Used by cron job.
 */

import { adminDb } from '@/lib/firebase/admin';
import type { Query, CollectionReference } from 'firebase-admin/firestore';

export interface ReportRow {
  level: string;
  name: string;
  id: string;
  memberCount: number;
}

export interface ReportConfig {
  level: 'regiment' | 'battalion' | 'company' | 'series' | 'platoon';
  regimentId?: string;
  battalionId?: string;
  companyId?: string;
  seriesId?: string;
  platoonId?: string;
}

async function getMemberCountByOrg(params: {
  regimentId?: string;
  battalionId?: string;
  companyId?: string;
  seriesId?: string;
  platoonId?: string;
}): Promise<number> {
  const config = await resolveOrgFilter(params);
  if (!config || Object.keys(config).length === 0) return 0;
  let ref: CollectionReference | Query = adminDb.collection('userProfiles');
  if (config.regiment) ref = ref.where('organizationalAssignment.regiment', '==', config.regiment);
  if (config.battalion) ref = ref.where('organizationalAssignment.battalion', '==', config.battalion);
  if (config.company) ref = ref.where('organizationalAssignment.company', '==', config.company);
  if (config.series) ref = ref.where('organizationalAssignment.series', '==', config.series);
  if (config.platoon) ref = ref.where('organizationalAssignment.platoon', '==', config.platoon);
  const snapshot = await ref.limit(1000).get();
  return snapshot.size;
}

async function resolveOrgFilter(params: {
  regimentId?: string;
  battalionId?: string;
  companyId?: string;
  seriesId?: string;
  platoonId?: string;
}): Promise<{ regiment?: string; battalion?: string; company?: string; series?: string; platoon?: string } | null> {
  if (params.platoonId) {
    const doc = await adminDb.collection('platoons').doc(params.platoonId).get();
    if (!doc.exists) return null;
    const d = doc.data() as { regiment?: string; battalion?: string; company?: string; series?: string; platoon?: string };
    return { regiment: d.regiment, battalion: d.battalion, company: d.company, series: d.series, platoon: d.platoon ?? params.platoonId };
  }
  if (params.seriesId) {
    const ser = await adminDb.collection('series').doc(params.seriesId).get();
    if (!ser.exists) return null;
    const coId = (ser.data() as { companyId?: string })?.companyId;
    const serName = (ser.data() as { name?: string })?.name;
    if (!coId) return { series: serName };
    const co = await adminDb.collection('companies').doc(coId).get();
    if (!co.exists) return { series: serName };
    const coName = (co.data() as { name?: string })?.name;
    const batId = (co.data() as { battalionId?: string })?.battalionId;
    if (!batId) return { company: coName, series: serName };
    const bat = await adminDb.collection('battalions').doc(batId).get();
    const batName = bat.exists ? (bat.data() as { name?: string })?.name : undefined;
    const regId = bat.exists ? (bat.data() as { regimentId?: string })?.regimentId : undefined;
    const regName = regId ? (await adminDb.collection('regiments').doc(regId).get()).data() as { name?: string } | undefined : undefined;
    return { regiment: regName?.name, battalion: batName, company: coName, series: serName };
  }
  if (params.companyId) {
    const co = await adminDb.collection('companies').doc(params.companyId).get();
    if (!co.exists) return null;
    const coName = (co.data() as { name?: string })?.name;
    const batId = (co.data() as { battalionId?: string })?.battalionId;
    if (!batId) return { company: coName };
    const bat = await adminDb.collection('battalions').doc(batId).get();
    const batName = bat.exists ? (bat.data() as { name?: string })?.name : undefined;
    const regId = bat.exists ? (bat.data() as { regimentId?: string })?.regimentId : undefined;
    const regName = regId ? (await adminDb.collection('regiments').doc(regId).get()).data() as { name?: string } | undefined : undefined;
    return { regiment: regName?.name, battalion: batName, company: coName };
  }
  if (params.battalionId) {
    const bat = await adminDb.collection('battalions').doc(params.battalionId).get();
    if (!bat.exists) return null;
    const batName = (bat.data() as { name?: string })?.name;
    const regId = (bat.data() as { regimentId?: string })?.regimentId;
    const regName = regId ? (await adminDb.collection('regiments').doc(regId).get()).data() as { name?: string } | undefined : undefined;
    return { regiment: regName?.name, battalion: batName };
  }
  if (params.regimentId) {
    const reg = await adminDb.collection('regiments').doc(params.regimentId).get();
    if (!reg.exists) return null;
    const name = (reg.data() as { name?: string })?.name;
    return { regiment: name };
  }
  return null;
}

export async function buildReportRows(config: ReportConfig): Promise<ReportRow[]> {
  const rows: ReportRow[] = [];

  if (config.level === 'regiment' && config.regimentId) {
    const regDoc = await adminDb.collection('regiments').doc(config.regimentId).get();
    if (!regDoc.exists) return rows;
    const name = (regDoc.data() as { name?: string })?.name ?? '';
    const count = await getMemberCountByOrg({ regimentId: config.regimentId });
    rows.push({ level: 'Regiment', name, id: config.regimentId, memberCount: count });
  } else if (config.level === 'battalion' && config.battalionId) {
    const batDoc = await adminDb.collection('battalions').doc(config.battalionId).get();
    if (!batDoc.exists) return rows;
    const batName = (batDoc.data() as { name?: string })?.name ?? '';
    const count = await getMemberCountByOrg({ battalionId: config.battalionId });
    rows.push({ level: 'Battalion', name: batName, id: config.battalionId, memberCount: count });
    const companiesSnap = await adminDb.collection('companies').where('battalionId', '==', config.battalionId).get();
    for (const coDoc of companiesSnap.docs) {
      const coData = coDoc.data() as { name?: string };
      const coCount = await getMemberCountByOrg({ companyId: coDoc.id });
      rows.push({ level: 'Company', name: coData.name ?? '', id: coDoc.id, memberCount: coCount });
    }
  } else if (config.level === 'company' && config.companyId) {
    const coDoc = await adminDb.collection('companies').doc(config.companyId).get();
    if (!coDoc.exists) return rows;
    const coName = (coDoc.data() as { name?: string })?.name ?? '';
    const count = await getMemberCountByOrg({ companyId: config.companyId });
    rows.push({ level: 'Company', name: coName, id: config.companyId, memberCount: count });
    const seriesSnap = await adminDb.collection('series').where('companyId', '==', config.companyId).get();
    for (const serDoc of seriesSnap.docs) {
      const serData = serDoc.data() as { name?: string };
      const serCount = await getMemberCountByOrg({ seriesId: serDoc.id });
      rows.push({ level: 'Series', name: serData.name ?? '', id: serDoc.id, memberCount: serCount });
    }
  } else if (config.level === 'series' && config.seriesId) {
    const serDoc = await adminDb.collection('series').doc(config.seriesId).get();
    if (!serDoc.exists) return rows;
    const serName = (serDoc.data() as { name?: string })?.name ?? '';
    const count = await getMemberCountByOrg({ seriesId: config.seriesId });
    rows.push({ level: 'Series', name: serName, id: config.seriesId, memberCount: count });
    const platoonsSnap = await adminDb.collection('platoons').where('seriesId', '==', config.seriesId).get();
    for (const plaDoc of platoonsSnap.docs) {
      const plaData = plaDoc.data() as { platoon?: string };
      const plaId = plaDoc.id;
      const plaCount = await getMemberCountByOrg({ platoonId: plaId });
      rows.push({ level: 'Platoon', name: plaData.platoon ?? plaId, id: plaId, memberCount: plaCount });
    }
  } else if (config.level === 'platoon' && config.platoonId) {
    const plaDoc = await adminDb.collection('platoons').doc(config.platoonId).get();
    if (!plaDoc.exists) return rows;
    const plaData = plaDoc.data() as { platoon?: string };
    const count = await getMemberCountByOrg({ platoonId: config.platoonId });
    rows.push({ level: 'Platoon', name: plaData.platoon ?? config.platoonId, id: config.platoonId, memberCount: count });
  }

  return rows;
}

export function reportRowsToCsv(rows: ReportRow[]): string {
  const escape = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const header = ['Level', 'Name', 'ID', 'Member Count'];
  const dataRows = rows.map((r) => [r.level, r.name, r.id, String(r.memberCount)]);
  return [header, ...dataRows].map((row) => row.map((c) => escape(String(c))).join(',')).join('\r\n');
}
