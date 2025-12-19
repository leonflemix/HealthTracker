import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithCustomToken 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp,
  orderBy 
} from 'firebase/firestore';
import { 
  Activity, 
  Utensils, 
  Smile, 
  Zap, 
  Moon, 
  Scale, 
  Pill, 
  BarChart2, 
  Calendar, 
  Trash2, 
  Edit2, 
  Plus, 
  CheckCircle, 
  Circle,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  AlertCircle,
  Settings,
  Droplets,
  Book,
  Heart,
  Sun,
  Briefcase,
  Music,
  Coffee,
  Dumbbell,
  CheckSquare,
  AlignLeft
} from 'lucide-react';

// --- Styles for Custom Animations & Mobile Safety ---
const GlobalStyles = () => (
  <style>{`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.5s ease-out forwards;
    }
    .safe-area-bottom {
      padding-bottom: env(safe-area-inset-bottom, 20px);
    }
    ::-webkit-scrollbar {
      width: 8px;
    }
    ::-webkit-scrollbar-track {
      background: #f1f5f9; 
    }
    ::-webkit-scrollbar-thumb {
      background: #cbd5e1; 
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #94a3b8; 
    }
  `}</style>
);

// --- Environment Helper ---
const getEnvVar = (key) => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[`VITE_${key}`] || import.meta.env[`REACT_APP_${key}`];
    }
  } catch (e) {}
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[`REACT_APP_${key}`] || process.env[`VITE_${key}`];
    }
  } catch (e) {}
  return '';
};

// --- Firebase Configuration ---
let firebaseConfig;
let appId = 'default-app-id';

try {
  if (typeof __firebase_config !== 'undefined') {
    firebaseConfig = JSON.parse(__firebase_config);
    appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  } else {
    firebaseConfig = {
      apiKey: getEnvVar('FIREBASE_API_KEY'),
      authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN'),
      projectId: getEnvVar('FIREBASE_PROJECT_ID'),
      storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID'),
      appId: getEnvVar('FIREBASE_APP_ID')
    };
    appId = 'production'; 
  }
} catch (e) {
  console.error('Firebase config loading error:', e);
  firebaseConfig = {}; 
}

// Initialize Firebase
const app = firebaseConfig.apiKey ? initializeApp(firebaseConfig) : undefined;
const auth = app ? getAuth(app) : undefined;
const db = app ? getFirestore(app) : undefined;

// --- Constants & Configs ---

const ICON_MAP = {
  Activity, Utensils, Smile, Zap, Moon, Scale, Droplets, Book, Heart, Sun, 
  Briefcase, Music, Coffee, Pill, Dumbbell, TrendingUp
};

const COLOR_OPTIONS = [
  { label: 'Blue', text: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200', hex: '#2563eb' },
  { label: 'Red', text: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200', hex: '#dc2626' },
  { label: 'Green', text: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200', hex: '#16a34a' },
  { label: 'Yellow', text: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200', hex: '#ca8a04' },
  { label: 'Purple', text: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200', hex: '#9333ea' },
  { label: 'Orange', text: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200', hex: '#ea580c' },
  { label: 'Pink', text: 'text-pink-600', bg: 'bg-pink-100', border: 'border-pink-200', hex: '#db2777' },
  { label: 'Indigo', text: 'text-indigo-600', bg: 'bg-indigo-100', border: 'border-indigo-200', hex: '#4f46e5' },
];

const DATA_TYPES = [
  { id: 'scale5', label: '1-5 Scale', desc: 'Mood, Energy', icon: Smile },
  { id: 'scale10', label: '1-10 Scale', desc: 'Pain, Stress', icon: Activity },
  { id: 'number', label: 'Number Input', desc: 'Weight, Water, Steps', icon: Scale },
  { id: 'boolean', label: 'Yes / No', desc: 'Completed?', icon: CheckSquare },
  { id: 'duration', label: 'Duration', desc: 'Minutes spent', icon: Clock },
  { id: 'text', label: 'Text Note', desc: 'Details, Journal', icon: AlignLeft },
];

const TABS = [
  { id: 'dashboard', icon: Activity, label: 'Dashboard' },
  { id: 'meds', icon: Pill, label: 'Medications' },
  { id: 'reports', icon: BarChart2, label: 'Reports' },
  { id: 'history', icon: Calendar, label: 'History' },
  { id: 'settings', icon: Settings, label: 'Manage Trackers' },
];

// --- Helper Functions ---

const getUserCollection = (userUid, collectionName) => {
  if (!db) return null; 
  return collection(db, 'artifacts', appId, 'users', userUid, collectionName);
};

// --- Helper Components ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Button = ({ onClick, children, variant = 'primary', className = "", disabled = false, type = "button" }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    ghost: "text-slate-500 hover:text-slate-700 hover:bg-slate-50",
    outline: "border border-slate-300 text-slate-700 hover:bg-slate-50"
  };
  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
    <input 
      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
      {...props}
    />
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Screen Components (Moved Outside App to prevent Flashing/Hanging) ---

const DashboardView = ({ trackers, medications, medLogs, entries, actions }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysMeds = useMemo(() => {
    return medications.filter(m => m.active).map(med => {
        return med.times.map(time => ({ ...med, scheduledTime: time, isTaken: medLogs.some(l => l.medicationId === med.id && l.date === todayStr && l.time === time) }));
    }).flat().sort((a,b) => a.scheduledTime.localeCompare(b.scheduledTime));
  }, [medications, medLogs, todayStr]);

  return (
    <div className="space-y-6 animate-fade-in">
      <section>
        <div className="flex justify-between items-center mb-3">
           <h2 className="text-lg font-bold text-slate-800">Quick Track</h2>
           <Button variant="ghost" className="text-sm" onClick={() => actions.setActiveTab('settings')}><Edit2 size={14} /> Customize</Button>
        </div>
        {trackers.length === 0 ? (
           <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-6 text-center">
              <p className="text-slate-500 mb-4">You haven't set up any trackers yet.</p>
              <Button onClick={() => actions.setIsTrackerBuilderOpen(true)}>Create Your First Tracker</Button>
           </div>
        ) : (
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {trackers.map((tracker) => {
                const Icon = ICON_MAP[tracker.icon] || Activity;
                const color = COLOR_OPTIONS[tracker.colorIndex] || COLOR_OPTIONS[0];
                const types = tracker.types || [tracker.dataType];
                return (
                  <button key={tracker.id} onClick={() => actions.openEntryModal(tracker)} className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all group">
                    <div className={`p-3 rounded-full mb-2 ${color.bg} ${color.text} group-hover:scale-110 transition-transform`}><Icon size={24} /></div>
                    <span className="font-semibold text-slate-700">{tracker.name}</span>
                    <div className="flex gap-1 mt-1 justify-center flex-wrap px-2">
                      {types.map(t => (<span key={t} className="text-[9px] px-1 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-wider font-bold">{DATA_TYPES.find(d => d.id === t)?.label.split(' ')[0] || t}</span>))}
                    </div>
                  </button>
                );
              })}
           </div>
        )}
      </section>

      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-slate-800">Medications</h2>
          <Button variant="ghost" className="text-sm" onClick={() => actions.setActiveTab('meds')}>Manage</Button>
        </div>
        <Card className="divide-y divide-slate-100">
          {todaysMeds.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">No medications scheduled for today.</div>
          ) : (
            todaysMeds.map((med, idx) => (
              <div key={`${med.id}-${med.scheduledTime}-${idx}`} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <button onClick={() => actions.toggleMedTaken(med.id, med.scheduledTime)} className={`transition-all ${med.isTaken ? 'text-green-500' : 'text-slate-300 hover:text-green-400'}`}>
                    {med.isTaken ? <CheckCircle size={28} className="fill-green-100" /> : <Circle size={28} />}
                  </button>
                  <div>
                    <div className={`font-semibold ${med.isTaken ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{med.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1"><Clock size={12} /> {med.scheduledTime} &bull; {med.dosage}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </Card>
      </section>

      <section>
         <h2 className="text-lg font-bold text-slate-800 mb-3">Recent Logs</h2>
         <Card className="divide-y divide-slate-100">
           {entries.slice(0, 5).map(entry => {
             const tracker = trackers.find(t => t.id === entry.trackerId);
             const Icon = tracker && ICON_MAP[tracker.icon] ? ICON_MAP[tracker.icon] : Activity;
             const color = tracker && COLOR_OPTIONS[tracker.colorIndex] ? COLOR_OPTIONS[tracker.colorIndex] : COLOR_OPTIONS[0];

             const getSummary = (e) => {
                 const parts = [];
                 if (e.boolean !== undefined) parts.push(e.boolean ? 'Yes' : 'No');
                 if (e.scale5) parts.push(`Rating: ${e.scale5}/5`);
                 if (e.scale10) parts.push(`Level: ${e.scale10}/10`);
                 if (e.number) parts.push(`Val: ${e.number}`);
                 if (e.duration) parts.push(`${e.duration}m`);
                 if (e.text) parts.push(`"${e.text}"`);
                 if (e.value && parts.length === 0) parts.push(e.value);
                 if (e.notes && !e.text) parts.push(e.notes);
                 return parts.join(' • ');
             };

             return (
               <div key={entry.id} className="p-4 flex items-center gap-3">
                 <div className={`p-2 rounded-full ${color.bg} ${color.text}`}><Icon size={16} /></div>
                 <div className="flex-1">
                   <div className="flex justify-between">
                     <span className="font-medium text-slate-800">{tracker ? tracker.name : 'Unknown Tracker'}</span>
                     <span className="text-xs text-slate-400">{new Date(entry.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                   </div>
                   <div className="text-sm text-slate-600 truncate max-w-[250px]">{getSummary(entry)}</div>
                 </div>
               </div>
             );
           })}
           {entries.length === 0 && <div className="p-4 text-center text-slate-500 text-sm">No recent activity.</div>}
         </Card>
      </section>
    </div>
  );
};

const MedicationsView = ({ medications, actions }) => (
  <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">My Medications</h2>
          <Button onClick={() => actions.setIsMedModalOpen(true)} className="text-sm"><Plus size={16}/> Add New</Button>
      </div>
      {medications.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <Pill size={40} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-500">No medications added yet.</p>
          </div>
      ) : (
          <div className="grid gap-4">
              {medications.map(med => (
                  <Card key={med.id} className="p-4 flex justify-between items-start">
                      <div>
                          <h3 className="font-bold text-slate-800 text-lg">{med.name}</h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">{med.dosage}</span>
                              <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-semibold">{med.frequency}</span>
                          </div>
                          <div className="mt-3 flex gap-2">
                              {med.times.map(t => (<span key={t} className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded"><Clock size={10} /> {t}</span>))}
                          </div>
                      </div>
                      <Button variant="ghost" onClick={() => actions.handleDeleteMedication(med.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></Button>
                  </Card>
              ))}
          </div>
      )}
  </div>
);

const ReportsView = ({ entries, trackers }) => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklyEntries = useMemo(() => entries.filter(e => new Date(e.date) >= oneWeekAgo), [entries]);

  const groupedData = useMemo(() => {
      const groups = {};
      trackers.forEach(t => groups[t.id] = { ...t, values: [] });
      weeklyEntries.forEach(e => {
          if (groups[e.trackerId]) {
              let val = null;
              let type = 'none';
              if (e.scale5 !== undefined) { val = e.scale5; type = 'scale5'; }
              else if (e.scale10 !== undefined) { val = e.scale10; type = 'scale10'; }
              else if (e.number !== undefined) { val = e.number; type = 'number'; }
              else if (e.duration !== undefined) { val = e.duration; type = 'duration'; }
              else if (e.boolean !== undefined) { val = e.boolean ? 1 : 0; type = 'boolean'; }
              else if (e.value !== undefined) { 
                  val = typeof e.value === 'boolean' ? (e.value ? 1 : 0) : Number(e.value);
                  type = isNaN(val) ? 'text' : 'legacy'; 
              }
              if (val !== null && type !== 'text') {
                  groups[e.trackerId].values.push(val);
                  if (!groups[e.trackerId].graphType) groups[e.trackerId].graphType = type;
              }
          }
      });
      return groups;
  }, [weeklyEntries, trackers]);

  return (
      <div className="space-y-6 animate-fade-in">
          <h2 className="text-xl font-bold text-slate-800">Weekly Summary</h2>
          {trackers.length === 0 && <p className="text-slate-500">No trackers to report on.</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.values(groupedData).map(group => {
                  if (group.values.length === 0) return null;
                  const avg = group.values.reduce((a,b) => a+b, 0) / group.values.length;
                  const total = group.values.reduce((a,b) => a+b, 0);
                  const color = COLOR_OPTIONS[group.colorIndex] || COLOR_OPTIONS[0];
                  const type = group.graphType;
                  return (
                      <Card key={group.id} className="p-4">
                          <div className="flex items-center gap-2 mb-4">
                              <div className={`w-2 h-2 rounded-full ${color.bg.replace('bg-', 'bg-')}`} style={{backgroundColor: color.hex}} />
                              <h3 className="font-bold text-slate-700">{group.name}</h3>
                          </div>
                          {(type === 'scale5' || type === 'scale10') && (
                              <div>
                                  <div className="text-3xl font-bold text-slate-800">{avg.toFixed(1)}</div>
                                  <div className="text-xs text-slate-400 uppercase">Average Score</div>
                                  <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full" style={{ width: `${(avg / (type === 'scale5' ? 5 : 10)) * 100}%`, backgroundColor: color.hex }} />
                                  </div>
                              </div>
                          )}
                          {(type === 'number' || type === 'duration' || type === 'legacy') && (
                              <div>
                                   <div className="text-3xl font-bold text-slate-800">{total}</div>
                                   <div className="text-xs text-slate-400 uppercase">Weekly Total</div>
                                   <div className="mt-2 text-sm text-slate-600">Daily Avg: {(total / 7).toFixed(1)}</div>
                              </div>
                          )}
                           {type === 'boolean' && (
                              <div>
                                   <div className="text-3xl font-bold text-slate-800">{total} <span className="text-sm font-normal text-slate-400">/ {group.values.length}</span></div>
                                   <div className="text-xs text-slate-400 uppercase">Times Occurred</div>
                              </div>
                          )}
                      </Card>
                  );
              })}
          </div>
      </div>
  );
};

const HistoryView = ({ entries, trackers, actions }) => (
  <div className="space-y-4 animate-fade-in">
    <h2 className="text-xl font-bold text-slate-800">History Log</h2>
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
          <tr>
            <th className="p-4">Date</th>
            <th className="p-4">Tracker</th>
            <th className="p-4">Details</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {entries.map(entry => {
             const tracker = trackers.find(t => t.id === entry.trackerId);
             const color = tracker && COLOR_OPTIONS[tracker.colorIndex] ? COLOR_OPTIONS[tracker.colorIndex] : COLOR_OPTIONS[0];
             const getDetails = (e) => {
                 const parts = [];
                 if (e.boolean !== undefined) parts.push(e.boolean ? 'Yes' : 'No');
                 if (e.scale5) parts.push(`Rating: ${e.scale5}`);
                 if (e.scale10) parts.push(`Level: ${e.scale10}`);
                 if (e.number) parts.push(`Value: ${e.number}`);
                 if (e.duration) parts.push(`${e.duration} min`);
                 if (e.text) parts.push(e.text);
                 if (e.notes && !e.text) parts.push(e.notes);
                 if (e.value && parts.length === 0) parts.push(e.value);
                 return parts.map((p, i) => (<div key={i} className="truncate max-w-xs">{p}</div>));
             };

             return (
              <tr key={entry.id} className="hover:bg-slate-50">
                <td className="p-4 whitespace-nowrap text-slate-500">
                  {new Date(entry.date).toLocaleDateString()} <br/>
                  <span className="text-xs text-slate-400">{new Date(entry.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                </td>
                <td className="p-4">
                   {tracker ? (
                       <span className={`px-2 py-1 rounded-full text-xs font-bold ${color.bg} ${color.text}`}>{tracker.name}</span>
                   ) : (
                       <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs">Unknown</span>
                   )}
                </td>
                <td className="p-4 text-slate-700 text-xs">{getDetails(entry)}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-1">
                    {tracker && (
                      <button onClick={() => actions.openEntryModal(tracker, entry)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                    )}
                    <button onClick={() => actions.handleDeleteEntry(entry.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
             )
          })}
        </tbody>
      </table>
      {entries.length === 0 && <div className="p-8 text-center text-slate-400">No entries yet.</div>}
    </div>
  </div>
);

const SettingsView = ({ trackers, actions }) => (
  <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Manage Trackers</h2>
          <Button onClick={() => actions.setIsTrackerBuilderOpen(true)}><Plus size={16}/> New Tracker</Button>
      </div>
      <div className="space-y-3">
          {trackers.map(tracker => {
              const Icon = ICON_MAP[tracker.icon] || Activity;
              const color = COLOR_OPTIONS[tracker.colorIndex] || COLOR_OPTIONS[0];
              const types = tracker.types || [tracker.dataType];
              return (
                  <Card key={tracker.id} className="p-4 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-lg ${color.bg} ${color.text}`}><Icon size={24} /></div>
                          <div>
                              <h3 className="font-bold text-slate-800">{tracker.name}</h3>
                              <div className="flex flex-wrap gap-1 mt-1">
                                  {types.map(t => (<span key={t} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">{DATA_TYPES.find(d => d.id === t)?.label || t}</span>))}
                              </div>
                          </div>
                      </div>
                      <Button variant="ghost" onClick={() => actions.handleDeleteTracker(tracker.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={18} /></Button>
                  </Card>
              );
          })}
          {trackers.length === 0 && (
              <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                  <Settings size={48} className="mx-auto mb-3 opacity-20" />
                  <p>No custom trackers defined.</p>
                  <p className="text-sm">Create one to start tracking your health!</p>
              </div>
          )}
      </div>
  </div>
);

// --- Main Application Component ---

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Data State
  const [trackers, setTrackers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [medications, setMedications] = useState([]);
  const [medLogs, setMedLogs] = useState([]);
  
  // Modal States
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [isTrackerBuilderOpen, setIsTrackerBuilderOpen] = useState(false);

  // Form States
  const [formData, setFormData] = useState({});
  const [medForm, setMedForm] = useState({ name: '', dosage: '', frequency: 'Daily', times: ['08:00'] });
  const [trackerForm, setTrackerForm] = useState({ name: '', types: ['scale5'], icon: 'Activity', colorIndex: 0 });

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        try { await signInAnonymously(auth); } catch (error) { console.error("Auth error:", error); }
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const safeSubscribe = (queryRef, setter) => {
        if (!queryRef) return () => {};
        return onSnapshot(queryRef, (snapshot) => {
            setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (err) => console.error("Firestore error:", err));
    };

    const unsubTrackers = safeSubscribe(getUserCollection(user.uid, 'tracker_definitions'), setTrackers);
    const entriesQuery = getUserCollection(user.uid, 'health_entries');
    const unsubEntries = onSnapshot(entriesQuery || [], (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setEntries(data);
    }, (err) => console.error("Entries error:", err));
    const unsubMeds = safeSubscribe(getUserCollection(user.uid, 'medications'), setMedications);
    const unsubMedLogs = safeSubscribe(getUserCollection(user.uid, 'medication_logs'), setMedLogs);

    return () => { unsubTrackers(); unsubEntries(); unsubMeds(); unsubMedLogs(); };
  }, [user]);

  // --- Actions ---

  const handleSaveTracker = async () => {
    if (!user || !db) return;
    if (!trackerForm.name) return alert("Please name your tracker");
    if (trackerForm.types.length === 0) return alert("Please select at least one data field");
    try {
      const primaryType = trackerForm.types[0]; 
      await addDoc(getUserCollection(user.uid, 'tracker_definitions'), {
        ...trackerForm, dataType: primaryType, createdAt: serverTimestamp()
      });
      setIsTrackerBuilderOpen(false);
      setTrackerForm({ name: '', types: ['scale5'], icon: 'Activity', colorIndex: 0 });
    } catch (e) { console.error("Error saving tracker:", e); }
  };

  const handleDeleteTracker = async (id) => {
    if (!user || !db || !confirm("Delete this tracker? Entries remain.")) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tracker_definitions', id));
  };

  const toggleTrackerType = (typeId) => {
    setTrackerForm(prev => {
      const types = prev.types.includes(typeId) ? prev.types.filter(t => t !== typeId) : [...prev.types, typeId];
      return { ...prev, types };
    });
  };

  const openEntryModal = (tracker, entry = null) => {
    setSelectedTracker(tracker);
    if (entry) {
      setEditingEntry(entry);
      setFormData({ ...entry });
    } else {
      setEditingEntry(null);
      setFormData({ date: new Date().toISOString().slice(0, 16), trackerId: tracker.id });
    }
    setIsEntryModalOpen(true);
  };

  const handleSaveEntry = async () => {
    if (!user || !db) return;
    const entryData = { ...formData, trackerId: selectedTracker.id, timestamp: serverTimestamp() };
    try {
      if (editingEntry) {
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'health_entries', editingEntry.id), entryData);
      } else {
        await addDoc(getUserCollection(user.uid, 'health_entries'), entryData);
      }
      setIsEntryModalOpen(false); setEditingEntry(null); setFormData({});
    } catch (e) { console.error("Error saving entry:", e); }
  };

  const handleDeleteEntry = async (id) => {
    if (!user || !db || !confirm('Delete this entry?')) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'health_entries', id));
  };

  const handleSaveMedication = async () => {
    if (!user || !db) return;
    await addDoc(getUserCollection(user.uid, 'medications'), { ...medForm, active: true, timestamp: serverTimestamp() });
    setIsMedModalOpen(false); setMedForm({ name: '', dosage: '', frequency: 'Daily', times: ['08:00'] });
  };

  const handleDeleteMedication = async (id) => {
    if (!user || !db || !confirm('Delete this medication?')) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'medications', id));
  };

  const toggleMedTaken = async (medId, timeSlot) => {
    if (!user || !db) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const existingLog = medLogs.find(log => log.medicationId === medId && log.date === todayStr && log.time === timeSlot);
    if (existingLog) {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'medication_logs', existingLog.id));
    } else {
      await addDoc(getUserCollection(user.uid, 'medication_logs'), { medicationId: medId, date: todayStr, time: timeSlot, taken: true, timestamp: serverTimestamp() });
    }
  };

  const renderDynamicForm = () => {
    if (!selectedTracker) return null;
    const typesToRender = selectedTracker.types || [selectedTracker.dataType];
    return (
      <div className="space-y-6">
        {typesToRender.includes('boolean') && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Did you do this?</label>
            <div className="flex gap-4">
                <button type="button" onClick={() => setFormData({...formData, boolean: true})} className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${formData.boolean === true ? 'border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500' : 'border-slate-200 text-slate-400'}`}>Yes</button>
                <button type="button" onClick={() => setFormData({...formData, boolean: false})} className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${formData.boolean === false ? 'border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500' : 'border-slate-200 text-slate-400'}`}>No</button>
            </div>
          </div>
        )}
        {(typesToRender.includes('scale5') || typesToRender.includes('scale10')) && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">Rating</label>
            {typesToRender.includes('scale5') ? (
              <div className="flex justify-between gap-2">
                {[1, 2, 3, 4, 5].map(val => (
                  <button key={val} type="button" onClick={() => setFormData({...formData, scale5: val})} className={`flex-1 py-3 rounded-lg border-2 font-bold transition-all ${formData.scale5 === val ? 'border-blue-500 bg-blue-50 text-blue-600 scale-105' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}>{val}</button>
                ))}
              </div>
            ) : (
               <div className="space-y-2">
                 <input type="range" min="1" max="10" value={formData.scale10 || 5} onChange={e => setFormData({...formData, scale10: Number(e.target.value)})} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                 <div className="text-center font-bold text-2xl text-blue-600">{formData.scale10 || 5}</div>
               </div>
            )}
          </div>
        )}
        {typesToRender.includes('number') && (
           <Input label={`Value (${selectedTracker.name})`} type="number" step="any" value={formData.number || ''} onChange={e => setFormData({...formData, number: Number(e.target.value)})} placeholder="0" />
        )}
        {typesToRender.includes('duration') && (
           <Input label="Duration (minutes)" type="number" value={formData.duration || ''} onChange={e => setFormData({...formData, duration: Number(e.target.value)})} placeholder="e.g. 30" />
        )}
        {typesToRender.includes('text') && (
           <div className="space-y-2">
             <label className="block text-sm font-medium text-slate-700">Notes / Details</label>
             <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[100px]" value={formData.text || ''} onChange={e => setFormData({...formData, text: e.target.value})} placeholder="Write your details here..." />
           </div>
        )}
      </div>
    );
  };

  // --- Main View ---
  
  const isPreview = typeof __firebase_config !== 'undefined';
  const hasConfig = firebaseConfig && firebaseConfig.apiKey;

  if (!hasConfig && !isPreview) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
              <div className="text-center max-w-md">
                  <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
                  <h1 className="text-2xl font-bold text-slate-800 mb-2">Configuration Missing</h1>
                  <p className="text-slate-600 mb-4">The app cannot connect to Firebase. Please check your environment variables in Vercel or your .env file.</p>
              </div>
          </div>
      );
  }

  // Group generic actions to pass down easily
  const actions = {
    setActiveTab, setIsTrackerBuilderOpen, openEntryModal, toggleMedTaken,
    setIsMedModalOpen, handleDeleteMedication, handleDeleteEntry, handleDeleteTracker
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 sm:pb-0 text-slate-900">
      <GlobalStyles />
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 shadow-sm">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><Activity size={24} /></div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-800">LifeTrack</h1>
          </div>
          <div className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded">{user ? `ID: ${user.uid.slice(0, 4)}` : '...'}</div>
        </div>
      </header>

      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'sm:ml-20' : 'sm:ml-64'}`}>
        <main className="max-w-4xl mx-auto p-4">
            {activeTab === 'dashboard' && <DashboardView trackers={trackers} medications={medications} medLogs={medLogs} entries={entries} actions={actions} />}
            {activeTab === 'meds' && <MedicationsView medications={medications} actions={actions} />}
            {activeTab === 'reports' && <ReportsView entries={entries} trackers={trackers} />}
            {activeTab === 'history' && <HistoryView entries={entries} trackers={trackers} actions={actions} />}
            {activeTab === 'settings' && <SettingsView trackers={trackers} actions={actions} />}
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 px-4 flex justify-around items-center z-40 safe-area-bottom sm:hidden">
         {TABS.slice(0, 5).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`}>
                <tab.icon size={20} />
                <span className="text-[10px] font-medium mt-1">{tab.label.split(' ')[0]}</span>
            </button>
         ))}
      </nav>

      <div className={`hidden sm:flex fixed left-0 top-16 bottom-0 bg-white border-r border-slate-200 flex-col transition-all duration-300 z-20 ${isSidebarCollapsed ? 'w-20 items-center py-4' : 'w-64 p-4'}`}>
         <div className="flex-1 space-y-2 w-full">
             {TABS.map(tab => (
                 <button key={tab.id} onClick={() => setActiveTab(tab.id)} title={isSidebarCollapsed ? tab.label : ''} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all w-full overflow-hidden whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'} ${isSidebarCollapsed ? 'justify-center px-2' : ''}`}>
                     <tab.icon size={20} className="shrink-0" />
                     <span className={`transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>{tab.label}</span>
                 </button>
             ))}
         </div>
         <div className={`pt-4 border-t border-slate-100 w-full flex ${isSidebarCollapsed ? 'justify-center' : 'justify-end'}`}>
            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
         </div>
      </div>

      <Modal isOpen={isEntryModalOpen} onClose={() => setIsEntryModalOpen(false)} title={`Log ${selectedTracker?.name || 'Entry'}`}>
        <div className="space-y-4">
          <Input type="datetime-local" label="Date & Time" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} />
          <hr className="border-slate-100" />
          {renderDynamicForm()}
          <div className="pt-4"><Button onClick={handleSaveEntry} className="w-full justify-center">Save Entry</Button></div>
        </div>
      </Modal>

      <Modal isOpen={isMedModalOpen} onClose={() => setIsMedModalOpen(false)} title="Add Medication">
        <div className="space-y-4">
          <Input label="Medication Name" placeholder="e.g., Lisinopril" value={medForm.name} onChange={e => setMedForm({...medForm, name: e.target.value})} />
          <Input label="Dosage" placeholder="e.g., 10mg" value={medForm.dosage} onChange={e => setMedForm({...medForm, dosage: e.target.value})} />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
            <select className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" value={medForm.frequency} onChange={e => setMedForm({...medForm, frequency: e.target.value})}>
                <option>Daily</option><option>Twice Daily</option><option>As Needed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Time(s)</label>
            <div className="flex gap-2 flex-wrap">
                {medForm.times.map((t, i) => (
                    <div key={i} className="flex items-center">
                        <input type="time" className="border border-slate-300 rounded px-2 py-1 text-sm" value={t} onChange={e => { const newTimes = [...medForm.times]; newTimes[i] = e.target.value; setMedForm({...medForm, times: newTimes}); }} />
                        {i > 0 && <button onClick={() => setMedForm({...medForm, times: medForm.times.filter((_, idx) => idx !== i)})} className="ml-1 text-red-400"><X size={14}/></button>}
                    </div>
                ))}
                <button onClick={() => setMedForm({...medForm, times: [...medForm.times, '12:00']})} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold hover:bg-slate-200">+ Add</button>
            </div>
          </div>
          <div className="pt-4"><Button onClick={handleSaveMedication} className="w-full justify-center">Add Schedule</Button></div>
        </div>
      </Modal>

      <Modal isOpen={isTrackerBuilderOpen} onClose={() => setIsTrackerBuilderOpen(false)} title="Create New Tracker">
        <div className="space-y-4">
            <Input label="Tracker Name" placeholder="e.g. Anxiety Level, Water, Steps" value={trackerForm.name} onChange={e => setTrackerForm({...trackerForm, name: e.target.value})} />
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Data Fields (Combine multiple!)</label>
                <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                    {DATA_TYPES.map(type => {
                        const isSelected = trackerForm.types.includes(type.id);
                        const Icon = type.icon;
                        return (
                            <button key={type.id} onClick={() => toggleTrackerType(type.id)} className={`text-left p-3 rounded-lg border-2 transition-all flex items-start gap-3 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-300'}`}>
                                <div className={`p-1.5 rounded-full ${isSelected ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-400'}`}><Icon size={16} /></div>
                                <div><div className={`font-bold text-sm ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{type.label}</div><div className="text-[10px] text-slate-500 leading-tight mt-0.5">{type.desc}</div></div>
                                {isSelected && <CheckCircle size={16} className="ml-auto text-blue-500 self-center" />}
                            </button>
                        );
                    })}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Choose Icon</label>
                <div className="flex flex-wrap gap-2">
                    {Object.keys(ICON_MAP).map(iconName => {
                        const Icon = ICON_MAP[iconName];
                        const isSelected = trackerForm.icon === iconName;
                        return (
                            <button key={iconName} onClick={() => setTrackerForm({...trackerForm, icon: iconName})} className={`p-2 rounded-lg transition-all ${isSelected ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-500' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}><Icon size={20} /></button>
                        );
                    })}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Choose Color</label>
                <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((c, idx) => (
                        <button key={idx} onClick={() => setTrackerForm({...trackerForm, colorIndex: idx})} className={`w-8 h-8 rounded-full border-2 transition-all ${trackerForm.colorIndex === idx ? 'ring-2 ring-offset-2 ring-slate-400 border-transparent' : 'border-transparent'}`} style={{backgroundColor: c.hex}} />
                    ))}
                </div>
            </div>
            <div className="pt-4"><Button onClick={handleSaveTracker} className="w-full justify-center">Create Custom Tracker</Button></div>
        </div>
      </Modal>
    </div>
  );
}