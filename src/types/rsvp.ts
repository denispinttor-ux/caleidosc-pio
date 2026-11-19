export type AttendanceStatus = 'attending' | 'not_attending';

export type GuestType = 'alone' | 'family' | 'single_plus_one';

export type FamilyRelationship = 'Cônjuge' | 'Filho(a)';

export type SingleCompanionRelationship =
  | 'Namorado(a)'
  | 'Amigo(a)'
  | 'Mãe / Pai'
  | 'Irmão / Irmã'
  | 'Acompanhante';

export type CompanionRelationship = FamilyRelationship | SingleCompanionRelationship;

export interface Companion {
  id: string;
  name: string;
  relationship: CompanionRelationship;
  age?: string;
}

export interface RsvpRecord {
  id: string;
  code: string;
  employeeName: string;
  employeeRole: string;
  phone: string;
  attendance: AttendanceStatus;
  guestType: GuestType;
  companions: Companion[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface RsvpPayload {
  employeeName: string;
  employeeRole: string;
  phone: string;
  attendance: AttendanceStatus;
  guestType: GuestType;
  companions: Companion[];
  notes: string;
}

export interface RsvpStats {
  totalResponses: number;
  attendingEmployees: number;
  notAttendingEmployees: number;
  totalPeople: number;
  totalSpouses: number;
  totalChildren: number;
  totalSingleCompanions: number;
}

export const EVENT_INFO = {
  schoolName: 'Escola Infantil Caleidoscópio',
  eventTitle: 'Confraternização Caleidoscópio 2026',
  dateDisplay: '20/12/2026',
  dateLong: 'Domingo, 20 de Dezembro de 2026',
  dateIso: '2026-12-20T09:00:00-03:00',
  timeDisplay: 'Das 9h às 17h',
  deadlineDisplay: '10 de dezembro de 2026',
  venueName: 'Chácara Irmãos Pincinato',
  addressLine1: 'Av. Comendador Gumercindo Barraqueiros, nº 1.072',
  addressLine2: 'Malota – Jundiaí/SP',
  mapsUrl: 'https://maps.app.goo.gl/XrGUiKks9nDiahmZA',
  logoUrl:
    '/assets/aistudio/WhatsApp_Image_2026-11-19_at_09.45.41-removebg-preview_616fa0fe.png',
  venuePoolImageUrl: '/assets/aistudio/images__1__1a052807.jfif',
  venueFieldImageUrl: '/assets/aistudio/images_a7f2a26d.jfif',
};

export const SINGLE_COMPANION_RELATIONSHIPS: SingleCompanionRelationship[] = [
  'Namorado(a)',
  'Amigo(a)',
  'Mãe / Pai',
  'Irmão / Irmã',
  'Acompanhante',
];
