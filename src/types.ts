export interface Job {
  id: number;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  created_at: string;
}

export interface Candidate {
  id: number;
  job_id: number;
  name: string;
  email: string;
  resume_path: string;
  status: string;
  created_at: string;
  job_title?: string;
}
