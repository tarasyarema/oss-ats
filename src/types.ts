import { Prisma } from '@prisma/client';

export type Job = {
  id: string;
  title: string;
  description?: string | null;
  linkedinUrl?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  candidates?: Candidate[];
};

export type JobView = Job & {
  candidateCount?: number;
};

export type Persona = {
  id: string;
  name: string;
  email: string;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  candidates?: Candidate[];
};

export type Candidate = {
  id: string;
  linkedinUrl?: string | null;
  cvUrl?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  personaId: string;
  persona: Persona;
  jobId: string;
  job: Job;
  steps?: ProcessStep[];
  currentStep?: ProcessStep | null;
};

export interface CandidateView {
  id: string;
  name: string;
  email: string;
  status: string;
  cvUrl: string | null;
  linkedinUrl: string | null;
  jobTitle?: string;
  createdAt: Date;
  updatedAt: Date;
  currentStep?: ProcessStep;
  persona: Persona;
  steps?: ProcessStep[];
  notes?: string | null;
  personaId: string;
  jobId: string;
}

export type ProcessStep = {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  notes: string | null;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  candidateId: string;
  candidate: Candidate;
};
