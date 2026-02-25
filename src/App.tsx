import { useState, useEffect, FormEvent } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { 
  Briefcase, 
  Users, 
  Plus, 
  MapPin, 
  Clock, 
  ChevronRight, 
  Upload, 
  CheckCircle2, 
  LayoutDashboard,
  Search,
  FileText,
  Mail,
  Calendar,
  Building2,
  ArrowLeft,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { Job, Candidate } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Navbar = ({ isAdmin }: { isAdmin?: boolean }) => (
  <nav className="border-bottom border-black/5 bg-white sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16 items-center">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
          <span className="text-xl font-semibold tracking-tight text-slate-900">MGCV <span className="text-emerald-600">Clone</span></span>
        </Link>
        <div className="flex gap-6 items-center">
          <Link to="/" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Careers</Link>
          <Link to="/admin" className={cn(
            "text-sm font-medium px-4 py-2 rounded-full transition-all",
            isAdmin ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"
          )}>
            HR Dashboard
          </Link>
        </div>
      </div>
    </div>
  </nav>
);

const JobCard = ({ job }: { job: Job }) => (
  <Link to={`/jobs/${job.id}`} className="block group">
    <motion.div 
      whileHover={{ y: -4 }}
      className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">{job.title}</h3>
          <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
            <Building2 size={14} /> {job.department}
          </p>
        </div>
        <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
          {job.type}
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm text-slate-500">
        <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
        <span className="flex items-center gap-1"><Clock size={14} /> {format(new Date(job.created_at), 'MMM d, yyyy')}</span>
      </div>
    </motion.div>
  </Link>
);

// --- Pages ---

const CareersPage = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => {
        setJobs(data);
        setLoading(false);
      });
  }, []);

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <header className="bg-white border-b border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4"
          >
            Join our world-class team
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto"
          >
            We're on a mission to build the future of work. Explore our open positions and find your next challenge.
          </motion.p>
          
          <div className="mt-10 max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text"
              placeholder="Search by role or department..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map(job => (
              <div key={job.id}>
                <JobCard job={job} />
              </div>
            ))}
            {filteredJobs.length === 0 && (
              <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                <p className="text-slate-500">No positions found matching your search.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then(res => res.json())
      .then(data => {
        setJob(data);
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const data = new FormData();
    data.append('job_id', id!);
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('resume', file);

    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        body: data,
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>;
  if (!job) return <div>Job not found</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft size={18} /> Back to jobs
        </button>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 md:p-12 border-b border-slate-100">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{job.title}</h1>
                <div className="flex flex-wrap gap-4 text-slate-500">
                  <span className="flex items-center gap-1"><Building2 size={16} /> {job.department}</span>
                  <span className="flex items-center gap-1"><MapPin size={16} /> {job.location}</span>
                  <span className="flex items-center gap-1"><Clock size={16} /> {job.type}</span>
                </div>
              </div>
              <button 
                onClick={() => setIsApplying(true)}
                className="px-8 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
              >
                Apply Now
              </button>
            </div>
            <div className="prose prose-slate max-w-none">
              <h3 className="text-xl font-semibold mb-4">About the role</h3>
              <p className="whitespace-pre-wrap text-slate-600 leading-relaxed">{job.description}</p>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isApplying && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
              >
                <div className="p-8">
                  {submitted ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={32} />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Sent!</h2>
                      <p className="text-slate-600 mb-8">Thank you for applying. Our team will review your profile and get back to you soon.</p>
                      <button 
                        onClick={() => navigate('/')}
                        className="w-full py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all"
                      >
                        Return to Careers
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-slate-900">Apply for this role</h2>
                        <button onClick={() => setIsApplying(false)} className="text-slate-400 hover:text-slate-600">
                          <Plus className="rotate-45" size={24} />
                        </button>
                      </div>
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                          <input 
                            required
                            type="text"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                          <input 
                            required
                            type="email"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Resume (PDF)</label>
                          <div className="relative">
                            <input 
                              required
                              type="file"
                              accept=".pdf,.doc,.docx"
                              className="hidden"
                              id="resume-upload"
                              onChange={e => setFile(e.target.files?.[0] || null)}
                            />
                            <label 
                              htmlFor="resume-upload"
                              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-all"
                            >
                              <Upload className="text-slate-400 mb-2" size={24} />
                              <span className="text-sm text-slate-500">
                                {file ? file.name : "Click to upload resume"}
                              </span>
                            </label>
                          </div>
                        </div>
                        <button 
                          type="submit"
                          className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                        >
                          Submit Application
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activeTab, setActiveTab] = useState<'jobs' | 'candidates'>('jobs');
  const [isAddingJob, setIsAddingJob] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', department: '', location: '', type: 'Full-time', description: '' });
  const [selectedResume, setSelectedResume] = useState<string | null>(null);
  const [viewingJob, setViewingJob] = useState<Job | null>(null);
  
  // Application form state for admin manual entry
  const [isApplying, setIsApplying] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch('/api/jobs').then(res => res.json()).then(setJobs);
    fetch('/api/candidates').then(res => res.json()).then(setCandidates);
  }, []);

  const handleAddJob = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newJob),
    });
    if (res.ok) {
      const data = await res.json();
      setJobs([{ ...newJob, id: data.id, created_at: new Date().toISOString() }, ...jobs]);
      setIsAddingJob(false);
      setNewJob({ title: '', department: '', location: '', type: 'Full-time', description: '' });
    }
  };

  const handleApply = async (e: FormEvent) => {
    e.preventDefault();
    if (!file || !viewingJob) return;

    const data = new FormData();
    data.append('job_id', viewingJob.id.toString());
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('resume', file);

    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        body: data,
      });
      if (res.ok) {
        setSubmitted(true);
        // Refresh candidates list
        fetch('/api/candidates').then(res => res.json()).then(setCandidates);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar isAdmin />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">HR Dashboard</h1>
            <p className="text-slate-500">Manage your hiring pipeline and job openings.</p>
          </div>
          <div className="flex bg-white p-1 rounded-xl border border-slate-200">
            <button 
              onClick={() => setActiveTab('jobs')}
              className={cn(
                "px-6 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === 'jobs' ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Job Roles
            </button>
            <button 
              onClick={() => setActiveTab('candidates')}
              className={cn(
                "px-6 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === 'candidates' ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Candidates
            </button>
          </div>
        </div>

        {activeTab === 'jobs' ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-900">Active Openings ({jobs.length})</h2>
              <button 
                onClick={() => setIsAddingJob(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-medium"
              >
                <Plus size={18} /> Create New Role
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Posted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map(job => (
                    <tr 
                      key={job.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => setViewingJob(job)}
                    >
                      <td className="px-6 py-4 font-medium text-slate-900 group-hover:text-emerald-600 transition-colors">{job.title}</td>
                      <td className="px-6 py-4 text-slate-600">{job.department}</td>
                      <td className="px-6 py-4 text-slate-600">{job.location}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">{job.type}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm flex items-center justify-between">
                        {format(new Date(job.created_at), 'MMM d, yyyy')}
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition-all" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-900">Recent Applications ({candidates.length})</h2>
            <div className="grid grid-cols-1 gap-4">
              {candidates.map(candidate => (
                <div key={candidate.id} 
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap justify-between items-center gap-6 hover:border-emerald-200 transition-all cursor-pointer group"
                  onClick={() => setSelectedResume(candidate.resume_path)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-lg group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      {candidate.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">{candidate.name}</h3>
                      <p className="text-sm text-slate-500 flex items-center gap-1"><Mail size={14} /> {candidate.email}</p>
                    </div>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Applied for</p>
                    <p className="text-slate-900 font-medium">{candidate.job_title}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedResume(candidate.resume_path);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all text-sm font-medium"
                    >
                      <FileText size={16} /> Preview
                    </button>
                    <a 
                      href={`/uploads/${candidate.resume_path}`} 
                      download={candidate.resume_path}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-all text-sm font-medium"
                      title="Download Resume"
                    >
                      <Download size={16} /> Download
                    </a>
                    <span className="ml-2 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                      {candidate.status}
                    </span>
                  </div>
                </div>
              ))}
              {candidates.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                  <p className="text-slate-500">No applications received yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAddingJob && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Create New Job Role</h2>
                  <button onClick={() => setIsAddingJob(false)} className="text-slate-400 hover:text-slate-600">
                    <Plus className="rotate-45" size={24} />
                  </button>
                </div>
                <form onSubmit={handleAddJob} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Job Title</label>
                      <input 
                        required
                        type="text"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        value={newJob.title}
                        onChange={e => setNewJob({...newJob, title: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Department</label>
                      <input 
                        required
                        type="text"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        value={newJob.department}
                        onChange={e => setNewJob({...newJob, department: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
                      <input 
                        required
                        type="text"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        value={newJob.location}
                        onChange={e => setNewJob({...newJob, location: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Job Type</label>
                      <select 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        value={newJob.type}
                        onChange={e => setNewJob({...newJob, type: e.target.value})}
                      >
                        <option>Full-time</option>
                        <option>Part-time</option>
                        <option>Contract</option>
                        <option>Internship</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Description (Optional)</label>
                    <textarea 
                      rows={6}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                      value={newJob.description}
                      onChange={e => setNewJob({...newJob, description: e.target.value})}
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                  >
                    Post Job Opening
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}

        {selectedResume && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <FileText size={20} className="text-emerald-600" /> Resume Preview
                </h3>
                <button 
                  onClick={() => setSelectedResume(null)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-all"
                >
                  <Plus className="rotate-45 text-slate-400" size={24} />
                </button>
              </div>
              <div className="flex-1 bg-slate-100 relative group/preview">
                <iframe 
                  src={`/uploads/${selectedResume}`}
                  className="w-full h-full border-none"
                  title="Resume Preview"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center pointer-events-none group-has-[iframe:not([src])]:pointer-events-auto">
                  <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-xl max-w-md pointer-events-auto">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText size={32} />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">Preview Blocked?</h4>
                    <p className="text-sm text-slate-600 mb-6">
                      Some browsers block inline document previews for security. If you don't see the resume above, you can open it directly.
                    </p>
                    <div className="flex flex-col gap-3">
                      <a 
                        href={`/uploads/${selectedResume}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Upload size={18} className="rotate-180" /> Open Resume in New Tab
                      </a>
                      <button 
                        onClick={() => setSelectedResume(null)}
                        className="w-full py-3 bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200 transition-all"
                      >
                        Close Preview
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {viewingJob && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{viewingJob.title}</h2>
                    <div className="flex flex-wrap gap-4 text-slate-500 text-sm">
                      <span className="flex items-center gap-1"><Building2 size={14} /> {viewingJob.department}</span>
                      <span className="flex items-center gap-1"><MapPin size={14} /> {viewingJob.location}</span>
                      <span className="flex items-center gap-1"><Clock size={14} /> {viewingJob.type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({ name: '', email: '' });
                        setFile(null);
                        setIsApplying(true);
                      }}
                      className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-all shadow-md"
                    >
                      Apply Now
                    </button>
                    <button onClick={() => setViewingJob(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                      <Plus className="rotate-45 text-slate-400" size={24} />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Job Description</h3>
                    <div className="p-4 bg-slate-50 rounded-xl text-slate-600 text-sm leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                      {viewingJob.description}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Candidates for this role</h3>
                    <div className="space-y-3">
                      {candidates.filter(c => c.job_id === viewingJob.id).length > 0 ? (
                        candidates.filter(c => c.job_id === viewingJob.id).map(candidate => (
                          <div key={candidate.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-xs">
                                {candidate.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900">{candidate.name}</p>
                                <p className="text-xs text-slate-500">{candidate.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setSelectedResume(candidate.resume_path)}
                                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline underline-offset-4"
                              >
                                Preview
                              </button>
                              <span className="text-slate-300">|</span>
                              <a 
                                href={`/uploads/${candidate.resume_path}`}
                                download={candidate.resume_path}
                                className="text-xs font-semibold text-slate-500 hover:text-slate-700 underline underline-offset-4 flex items-center gap-1"
                              >
                                <Download size={12} /> Download
                              </a>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-400 italic py-4 text-center bg-slate-50 rounded-xl">No candidates have applied for this role yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                  <button 
                    onClick={() => setViewingJob(null)}
                    className="px-6 py-2 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isApplying && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-8">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Sent!</h2>
                    <p className="text-slate-600 mb-8">The candidate has been successfully added to the system.</p>
                    <button 
                      onClick={() => setIsApplying(false)}
                      className="w-full py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-slate-900">Add Candidate</h2>
                      <button onClick={() => setIsApplying(false)} className="text-slate-400 hover:text-slate-600">
                        <Plus className="rotate-45" size={24} />
                      </button>
                    </div>
                    <form onSubmit={handleApply} className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                        <input 
                          required
                          type="text"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                        <input 
                          required
                          type="email"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Resume (PDF)</label>
                        <div className="relative">
                          <input 
                            required
                            type="file"
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                            id="admin-resume-upload"
                            onChange={e => setFile(e.target.files?.[0] || null)}
                          />
                          <label 
                            htmlFor="admin-resume-upload"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-all"
                          >
                            <Upload className="text-slate-400 mb-2" size={24} />
                            <span className="text-sm text-slate-500">
                              {file ? file.name : "Click to upload resume"}
                            </span>
                          </label>
                        </div>
                      </div>
                      <button 
                        type="submit"
                        className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                      >
                        Submit Application
                      </button>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CareersPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}
