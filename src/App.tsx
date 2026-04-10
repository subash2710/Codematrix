import { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Terminal, 
  FileText, 
  Zap, 
  Search, 
  Clock, 
  ChevronRight,
  RefreshCcw,
  Database,
  Network,
  Cpu,
  CheckCircle2,
  XCircle,
  Loader2,
  Lock,
  Mail,
  User,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Alert, Incident, analyzeIncident } from './services/aiService';
import { SCENARIOS, Scenario } from './constants/scenarios';
import { auth } from './firebase';
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser 
} from 'firebase/auth';

function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-security-bg p-6">
      <div className="scanline" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-security-card border border-security-border rounded-2xl p-8 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-security-accent/20 rounded-2xl flex items-center justify-center border border-security-accent/30 mb-4">
            <Shield className="w-10 h-10 text-security-accent" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">CODE MATRIX</h1>
          <p className="text-gray-500 text-sm font-mono">ADMINISTRATOR ACCESS</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
              <Mail className="w-3 h-3" /> Email Address
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-security-bg border border-security-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-security-accent transition-colors"
              placeholder="admin@codematrix.ai"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
              <Lock className="w-3 h-3" /> Password
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-security-bg border border-security-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-security-accent transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-500 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-security-accent hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'INITIALIZE SESSION'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-security-border text-center">
          <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">
            Authorized Personnel Only • Encrypted Connection
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [currentIncident, setCurrentIncident] = useState<Incident | null>(null);
  const [report, setReport] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [simulationProgress, setSimulationProgress] = useState(0);

  const alertsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    alertsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [alerts]);

  const runSimulation = async (scenario: Scenario) => {
    setAlerts([]);
    setCurrentIncident(null);
    setReport(null);
    setActiveScenario(scenario.name);
    setSimulationProgress(0);

    const newAlerts: Alert[] = [];
    
    for (let i = 0; i < scenario.alerts.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const alert: Alert = {
        ...scenario.alerts[i],
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
      } as Alert;
      
      newAlerts.push(alert);
      setAlerts(prev => [...prev, alert]);
      setSimulationProgress(((i + 1) / scenario.alerts.length) * 100);
    }

    // Correlation Phase
    await new Promise(resolve => setTimeout(resolve, 1000));
    const incident: Incident = {
      id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
      alerts: newAlerts,
      startTime: newAlerts[0].timestamp,
      endTime: newAlerts[newAlerts.length - 1].timestamp,
      status: "Analyzing"
    };
    setCurrentIncident(incident);

    // AI Analysis Phase
    setIsAnalyzing(true);
    const analysisReport = await analyzeIncident(incident);
    setReport(analysisReport);
    setIsAnalyzing(false);
    setCurrentIncident(prev => prev ? { ...prev, status: "Resolved" } : null);
    setActiveScenario(null);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'High': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'Medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  const getToolIcon = (tool: string) => {
    switch (tool) {
      case 'SIEM': return <Database className="w-4 h-4" />;
      case 'EDR': return <Cpu className="w-4 h-4" />;
      case 'IDS': return <Network className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-security-bg flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-security-accent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={() => {}} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-security-border bg-security-card flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-security-accent/20 rounded-lg flex items-center justify-center border border-security-accent/30">
            <Shield className="w-6 h-6 text-security-accent" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">CODE MATRIX</h1>
            <p className="text-xs text-gray-500 font-mono">SOC AUTOMATION v2.4.0</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-security-bg rounded-full border border-security-border">
            <div className="w-2 h-2 bg-security-success rounded-full animate-pulse" />
            <span className="text-xs font-medium text-gray-400">SYSTEMS ONLINE</span>
          </div>
          <div className="flex items-center gap-4 text-gray-500">
            <Search className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
            <div className="flex items-center gap-2 px-3 py-1 bg-security-bg border border-security-border rounded-lg group cursor-pointer hover:border-red-500/50 transition-all" onClick={() => signOut(auth)}>
              <span className="text-[10px] font-mono group-hover:text-red-500">{user.email}</span>
              <LogOut className="w-3 h-3 group-hover:text-red-500" />
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-security-accent to-purple-600 border border-white/10" />
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-hidden max-h-[calc(100vh-64px)]">
        {/* Left Sidebar: Controls & Scenarios */}
        <div className="col-span-3 flex flex-col gap-6 overflow-y-auto pr-2">
          <section className="bg-security-card border border-security-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-security-accent" />
              ATTACK SIMULATOR
            </h2>
            <div className="space-y-3">
              {SCENARIOS.map((scenario) => (
                <button
                  key={scenario.name}
                  onClick={() => runSimulation(scenario)}
                  disabled={activeScenario !== null}
                  className={`w-full text-left p-4 rounded-lg border transition-all group relative overflow-hidden ${
                    activeScenario === scenario.name 
                      ? 'border-security-accent bg-security-accent/5' 
                      : 'border-security-border hover:border-security-accent/50 bg-security-bg/50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-white group-hover:text-security-accent transition-colors">
                      {scenario.name}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-security-accent" />
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {scenario.description}
                  </p>
                  {activeScenario === scenario.name && (
                    <div className="absolute bottom-0 left-0 h-1 bg-security-accent transition-all duration-500" style={{ width: `${simulationProgress}%` }} />
                  )}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-security-card border border-security-border rounded-xl p-5 flex-1">
            <h2 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-security-accent" />
              SYSTEM METRICS
            </h2>
            <div className="space-y-4">
              {[
                { label: 'Alert Ingestion', value: '1.2k/s', status: 'Optimal' },
                { label: 'Correlation Latency', value: '42ms', status: 'Optimal' },
                { label: 'AI Model Status', value: 'Ready', status: 'Idle' },
              ].map((metric) => (
                <div key={metric.label} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">{metric.label}</span>
                    <span className="text-white font-mono">{metric.value}</span>
                  </div>
                  <div className="h-1.5 w-full bg-security-bg rounded-full overflow-hidden">
                    <div className="h-full bg-security-accent w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Center: Live Alert Feed */}
        <div className="col-span-4 flex flex-col bg-security-card border border-security-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-security-border flex justify-between items-center bg-security-card/50">
            <h2 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-security-accent" />
              LIVE ALERT FEED
            </h2>
            <span className="text-[10px] font-mono text-gray-600">REAL-TIME STREAM</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono">
            <AnimatePresence initial={false}>
              {alerts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-3 opacity-50">
                  <Activity className="w-12 h-12 animate-pulse" />
                  <p className="text-xs">WAITING FOR INGESTION...</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded border ${getSeverityColor(alert.severity)} flex flex-col gap-2`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {getToolIcon(alert.tool)}
                        <span className="text-[10px] font-bold uppercase tracking-wider">{alert.tool}</span>
                      </div>
                      <span className="text-[10px] opacity-60">{alert.timestamp}</span>
                    </div>
                    <div className="text-xs font-bold text-white">{alert.type}</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                      {Object.entries(alert.details).map(([key, val]) => (
                        <div key={key} className="text-[10px] flex gap-1">
                          <span className="opacity-50 uppercase">{key}:</span>
                          <span className="text-gray-300 truncate">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
            <div ref={alertsEndRef} />
          </div>
        </div>

        {/* Right: AI Investigation Report */}
        <div className="col-span-5 flex flex-col bg-security-card border border-security-border rounded-xl overflow-hidden relative">
          <div className="scanline" />
          <div className="p-4 border-b border-security-border flex justify-between items-center bg-security-card/50">
            <h2 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
              <FileText className="w-4 h-4 text-security-accent" />
              INVESTIGATION REPORT
            </h2>
            {currentIncident && (
              <span className="text-[10px] font-mono bg-security-accent/20 text-security-accent px-2 py-0.5 rounded border border-security-accent/30">
                {currentIncident.id}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {!currentIncident && !isAnalyzing ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-4">
                <Shield className="w-16 h-16 opacity-10" />
                <p className="text-sm text-center max-w-[200px]">Select a scenario to begin automated investigation</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Status Indicator */}
                <div className="flex items-center gap-4 p-4 bg-security-bg rounded-lg border border-security-border">
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-8 h-8 text-security-accent animate-spin" />
                      <div>
                        <p className="text-sm font-bold text-white">AI ANALYSIS IN PROGRESS</p>
                        <p className="text-xs text-gray-500">Correlating alerts and generating root cause...</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-8 h-8 text-security-success" />
                      <div>
                        <p className="text-sm font-bold text-white">INVESTIGATION COMPLETE</p>
                        <p className="text-xs text-gray-500">Report generated by Code Matrix AI</p>
                      </div>
                    </>
                  )}
                </div>

                {report && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Classification & Severity */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-security-bg rounded border border-security-border">
                        <p className="text-[10px] text-gray-500 uppercase mb-1">Classification</p>
                        <p className="text-sm font-bold text-white">{report.classification}</p>
                      </div>
                      <div className={`p-3 rounded border ${getSeverityColor(report.severity)}`}>
                        <p className="text-[10px] opacity-60 uppercase mb-1">Severity</p>
                        <p className="text-sm font-bold">{report.severity}</p>
                      </div>
                    </div>

                    {/* Summary */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                        <div className="w-1 h-3 bg-security-accent" />
                        Executive Summary
                      </h3>
                      <p className="text-sm text-gray-300 leading-relaxed bg-security-bg/50 p-3 rounded border border-security-border">
                        {report.summary}
                      </p>
                    </div>

                    {/* Root Cause */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                        <div className="w-1 h-3 bg-red-500" />
                        Root Cause Analysis
                      </h3>
                      <p className="text-sm text-gray-300 bg-red-500/5 p-3 rounded border border-red-500/10">
                        {report.rootCause}
                      </p>
                    </div>

                    {/* Timeline */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                        <div className="w-1 h-3 bg-security-accent" />
                        Attack Timeline
                      </h3>
                      <div className="space-y-3 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-security-border">
                        {report.timeline.map((item: any, idx: number) => (
                          <div key={idx} className="flex gap-4 relative">
                            <div className="w-4 h-4 rounded-full bg-security-card border-2 border-security-accent z-10 mt-1" />
                            <div>
                              <span className="text-[10px] font-mono text-security-accent">{item.time}</span>
                              <p className="text-xs text-gray-300">{item.event}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                        <div className="w-1 h-3 bg-security-success" />
                        Response Recommendations
                      </h3>
                      <div className="space-y-2">
                        {report.recommendations.map((rec: string, idx: number) => (
                          <div key={idx} className="flex gap-3 items-start p-2 bg-security-success/5 rounded border border-security-success/10">
                            <CheckCircle2 className="w-4 h-4 text-security-success mt-0.5 shrink-0" />
                            <span className="text-xs text-gray-300">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="h-8 border-t border-security-border bg-security-card px-4 flex items-center justify-between text-[10px] font-mono text-gray-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <RefreshCcw className="w-3 h-3" />
            LAST SYNC: JUST NOW
          </span>
          <span className="flex items-center gap-1">
            <Database className="w-3 h-3" />
            DB: CONNECTED
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-security-accent">CODE_MATRIX_READY</span>
          <span className="text-gray-700">|</span>
          <span>LATENCY: 12ms</span>
        </div>
      </footer>
    </div>
  );
}
