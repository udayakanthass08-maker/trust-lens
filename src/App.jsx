import { useState, useEffect, useRef, useCallback } from "react";

// ── Color tokens ──────────────────────────────────────────────────────────────
const C = {
  bg: "#0a0b0d",
  surface: "#11141a",
  card: "#161b24",
  border: "#1e2530",
  borderM: "#252e3d",
  text: "#e8eaf0",
  muted: "#6b7585",
  dim: "#3a4459",
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  blue: "#3b82f6",
  teal: "#14b8a6",
  greenBg: "rgba(34,197,94,0.08)",
  amberBg: "rgba(245,158,11,0.08)",
  redBg: "rgba(239,68,68,0.08)",
  blueBg: "rgba(59,130,246,0.08)",
};

// ── Risk helpers ──────────────────────────────────────────────────────────────
function riskColor(score) {
  if (score >= 70) return C.green;
  if (score >= 45) return C.amber;
  return C.red;
}
function riskLabel(score) {
  if (score >= 70) return "LOW RISK";
  if (score >= 45) return "SUSPICIOUS";
  return "HIGH RISK";
}
function riskBg(score) {
  if (score >= 70) return C.greenBg;
  if (score >= 45) return C.amberBg;
  return C.redBg;
}

// ── Sample data ───────────────────────────────────────────────────────────────
const HISTORY = [
  { id: 1, type: "Video call", time: "09:42", trust: 91, confidence: 94, signals: [], duration: "4m 12s" },
  { id: 2, type: "Voice call", time: "09:18", trust: 42, confidence: 88, signals: ["Voice spectral anomaly", "A/V sync degradation"], duration: "2m 07s" },
  { id: 3, type: "Video call", time: "08:57", trust: 18, confidence: 91, signals: ["AI voice signature", "Facial motion anomaly", "Lip-sync mismatch"], duration: "6m 33s" },
  { id: 4, type: "Voice call", time: "Yesterday 16:22", trust: 87, confidence: 92, signals: [], duration: "1m 48s" },
  { id: 5, type: "Video call", time: "Yesterday 11:05", trust: 64, confidence: 79, signals: ["Temporal inconsistency"], duration: "8m 21s" },
  { id: 6, type: "Video call", time: "Yesterday 09:30", trust: 95, confidence: 97, signals: [], duration: "3m 55s" },
];

// ── Animated Trust Score orb ──────────────────────────────────────────────────
function TrustOrb({ score, size = 200, animate = false }) {
  const color = riskColor(score);
  const [displayed, setDisplayed] = useState(score);

  useEffect(() => {
    if (!animate) { setDisplayed(score); return; }
    let start = displayed, end = score, frame;
    const step = () => {
      start += (end - start) * 0.08;
      setDisplayed(Math.round(start));
      if (Math.abs(start - end) > 0.5) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const r = size / 2 - 12;
  const circ = 2 * Math.PI * r;
  const dash = circ * (displayed / 100);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ position: "absolute", top: 0, left: 0 }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.border} strokeWidth={6} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={6} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray 0.6s ease, stroke 0.6s ease" }} />
        <circle cx={size / 2} cy={size / 2} r={r + 10} fill="none"
          stroke={color} strokeWidth={1} opacity={0.15} />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center"
      }}>
        <div style={{
          fontSize: size / 4.5, fontWeight: 700, color,
          transition: "color 0.6s ease", fontVariantNumeric: "tabular-nums", lineHeight: 1
        }}>
          {displayed}
        </div>
        <div style={{
          fontSize: size / 12, color: C.muted, letterSpacing: "0.12em",
          marginTop: 4, textTransform: "uppercase"
        }}>trust</div>
      </div>
    </div>
  );
}

// ── Signal badge ──────────────────────────────────────────────────────────────
function SignalDot({ status }) {
  const map = {
    ok: { color: C.green, label: "NORMAL" },
    warn: { color: C.amber, label: "SUSPICIOUS" },
    bad: { color: C.red, label: "ANOMALY" },
    info: { color: C.blue, label: "UNAVAILABLE" },
  };
  const { color, label } = map[status] || map.info;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%", background: color,
        boxShadow: `0 0 6px ${color}`
      }} />
      {label}
    </span>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────
function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick}
      style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
        padding: "1.25rem", ...style, cursor: onClick ? "pointer" : "default",
        transition: "border-color 0.2s"
      }}
      onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = C.borderM)}
      onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = C.border)}>
      {children}
    </div>
  );
}

function Label({ children }) {
  return <div style={{
    fontSize: 11, color: C.muted, letterSpacing: "0.1em",
    textTransform: "uppercase", marginBottom: 6
  }}>{children}</div>;
}

function Heading({ children, size = 16, style }) {
  return <div style={{ fontSize: size, fontWeight: 600, color: C.text, ...style }}>{children}</div>;
}

// ── Nav sidebar ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", icon: "⬡", label: "Dashboard" },
  { id: "live", icon: "◉", label: "Live Analysis" },
  { id: "media", icon: "◈", label: "Analyze Media" },
  { id: "insights", icon: "◷", label: "Insights" },
  { id: "history", icon: "≡", label: "History" },
  { id: "reports", icon: "⚑", label: "Reports" },
  { id: "network", icon: "⬡", label: "Trust Network" },
  { id: "lab", icon: "⬙", label: "Lab" },
  { id: "hardware", icon: "◧", label: "Hardware" },
  { id: "settings", icon: "◌", label: "Settings" },
];

function Sidebar({ active, setActive }) {
  return (
    <nav style={{
      width: 220, background: C.surface, borderRight: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column", flexShrink: 0, height: "100vh",
      position: "sticky", top: 0, overflowY: "auto"
    }}>
      <div style={{ padding: "1.5rem 1.25rem 1rem", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: "0.05em" }}>
          TRUST<span style={{ color: C.teal }}>LENS</span>
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Digital Trust Layer</div>
      </div>
      <div style={{
        margin: "0.75rem 1rem", background: C.greenBg, border: `1px solid ${C.green}22`,
        borderRadius: 8, padding: "0.5rem 0.75rem", display: "flex", alignItems: "center", gap: 8
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: "50%", background: C.green,
          boxShadow: `0 0 8px ${C.green}`, animation: "pulse 2s infinite"
        }} />
        <span style={{ fontSize: 11, color: C.green, fontWeight: 600, letterSpacing: "0.08em" }}>
          PROTECTION ACTIVE
        </span>
      </div>
      <div style={{ padding: "0.5rem 0", flex: 1 }}>
        {NAV_ITEMS.map(n => (
          <div key={n.id} onClick={() => setActive(n.id)}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "0.6rem 1.25rem",
              cursor: "pointer", borderRadius: 8, margin: "1px 8px",
              background: active === n.id ? `${C.teal}15` : "transparent",
              color: active === n.id ? C.teal : C.muted,
              transition: "all 0.15s", fontSize: 14, fontWeight: active === n.id ? 600 : 400
            }}>
            <span style={{ fontSize: 15 }}>{n.icon}</span>
            {n.label}
          </div>
        ))}
      </div>
    </nav>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SPLASH SCREEN
// ══════════════════════════════════════════════════════════════════════════════
function Splash({ onDone }) {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 2600);
    const t3 = setTimeout(onDone, 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf, t = 0;
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    const cx = W / 2, cy = H / 2;

    const particles = Array.from({ length: 80 }, () => ({
      angle: Math.random() * Math.PI * 2,
      r: 60 + Math.random() * 160,
      speed: 0.002 + Math.random() * 0.004,
      size: 1 + Math.random() * 2,
      opacity: 0.2 + Math.random() * 0.5,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.016;
      [80, 140, 200, 260].forEach((r, i) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(20,184,166,${0.06 + i * 0.02})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      const sweep = t * 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, 200, sweep, sweep + Math.PI * 0.4);
      ctx.strokeStyle = "rgba(20,184,166,0.6)";
      ctx.lineWidth = 2;
      ctx.stroke();
      particles.forEach(p => {
        p.angle += p.speed;
        const x = cx + Math.cos(p.angle) * p.r;
        const y = cy + Math.sin(p.angle) * p.r;
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(20,184,166,${p.opacity})`;
        ctx.fill();
      });
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
      grad.addColorStop(0, "rgba(20,184,166,0.12)");
      grad.addColorStop(1, "rgba(20,184,166,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, 60, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, background: C.bg, display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 999,
      opacity: phase === 2 ? 0 : 1, transition: "opacity 0.8s ease"
    }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      <div style={{
        position: "relative", textAlign: "center",
        opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.8s ease"
      }}>
        <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: "0.12em", color: C.text }}>
          TRUST<span style={{ color: C.teal }}>LENS</span>
        </div>
        <div style={{
          fontSize: 15, color: C.muted, letterSpacing: "0.2em", marginTop: 12,
          textTransform: "uppercase"
        }}>
          See Beyond the Signal
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function Dashboard({ setPage }) {
  const [score, setScore] = useState(82);
  const [recentActivity, setRecentActivity] = useState([]);
  const [dashLoading, setDashLoading] = useState(true);
  const [allHistory, setAllHistory] = useState([]);
  const [reportCount, setReportCount] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:5001/api/history").then(res => res.json()),
      fetch("http://localhost:5001/api/reports").then(res => res.json())
    ])
      .then(([history, reports]) => {
        setAllHistory(history);
        setRecentActivity(history.slice(0, 5));
        setReportCount(reports.length);
        setDashLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch dashboard data:", err);
        setDashLoading(false);
      });
  }, []);

  const totalAnalyzed = allHistory.length;
  const suspiciousCount = allHistory.filter(h => h.trust < 70 && h.trust >= 45).length;
  const highRiskCount = allHistory.filter(h => h.trust < 45).length;

  const signalCounts = {};
  allHistory.forEach(h => {
    (h.signals || []).forEach(s => {
      signalCounts[s] = (signalCounts[s] || 0) + 1;
    });
  });
  const topSignalEntry = Object.entries(signalCounts).sort((a, b) => b[1] - a[1])[0];
  const topSignal = topSignalEntry ? topSignalEntry[0] : "None yet";
  const topSignalCount = topSignalEntry ? topSignalEntry[1] : 0;

  const voiceCount = allHistory.filter(h => h.type === "Voice call").length;
  const videoCount = allHistory.filter(h => h.type === "Video call").length;
  const totalCalls = voiceCount + videoCount || 1;
  const voicePct = Math.round((voiceCount / totalCalls) * 100);
  const videoPct = 100 - voicePct;

  const trendData = allHistory.slice(0, 9).reverse().map(h => h.trust);

  // REAL LIVE SCORE FETCHER
  useEffect(() => {
    const fetchLiveScore = () => {
      fetch("http://localhost:8000/api/latest-score")
        .then(res => res.json())
        .then(data => {
          if (data && typeof data.trust_score === 'number') {
            setScore(data.trust_score);
          }
        })
        .catch(err => console.log("Dashboard fetch error:", err));
    };

    fetchLiveScore();
    const t = setInterval(fetchLiveScore, 2000);
    return () => clearInterval(t);
  }, []);

  const stats = [
    { label: "Analyzed", value: totalAnalyzed, color: C.teal },
    { label: "Suspicious", value: suspiciousCount, color: C.amber },
    { label: "High Risk", value: highRiskCount, color: C.red },
    { label: "Reports", value: reportCount, color: C.blue },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <Heading size={22}>Trust Center</Heading>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
            Your real-time communication trust dashboard
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {stats.map(s => (
          <Card key={s.label}>
            <Label>{s.label}</Label>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: "1.25rem" }}>
        <Card style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: "1rem", padding: "2rem"
        }}>
          <Label>Current Trust Level</Label>
          <TrustOrb score={score} size={180} animate />
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: riskColor(score),
              letterSpacing: "0.1em"
            }}>{riskLabel(score)}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
              Confidence: <span style={{ color: C.text }}>87%</span>
            </div>
          </div>
        </Card>

        <Card>
          <Heading style={{ marginBottom: "1rem" }}>Recent Activity</Heading>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentActivity.map(h => (
              <div key={h.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "0.6rem 0.75rem", borderRadius: 8,
                background: h.trust < 50 ? `${riskColor(h.trust)}08` : "transparent",
                border: `1px solid ${h.trust < 50 ? riskColor(h.trust) + "22" : C.border}`
              }}>
                <div style={{ fontSize: 11, color: C.muted, minWidth: 50, fontVariantNumeric: "tabular-nums" }}>
                  {h.time}
                </div>
                <div style={{ flex: 1, fontSize: 13, color: C.text }}>{h.type}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: riskColor(h.trust) }}>
                  {h.trust}
                </div>
                <div style={{
                  fontSize: 11, color: riskColor(h.trust), minWidth: 70,
                  letterSpacing: "0.06em"
                }}>{riskLabel(h.trust)}</div>
                {h.signals.length > 0 && (
                  <div style={{ fontSize: 11, color: C.muted }}>
                    {h.signals.length} signal{h.signals.length > 1 ? "s" : ""}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.25rem" }}>
        <Card>
          <Label>Most Common Signal</Label>
          <Heading size={15} style={{ marginBottom: 8 }}>{topSignal}</Heading>
          <div style={{ fontSize: 12, color: C.muted }}>
            Detected in {topSignalCount} of {totalAnalyzed} analyses
          </div>
          <div style={{ marginTop: 12, height: 4, borderRadius: 2, background: C.border }}>
            <div style={{ height: "100%", width: `${totalAnalyzed ? (topSignalCount / totalAnalyzed) * 100 : 0}%`, borderRadius: 2, background: C.amber }} />
          </div>
        </Card>
        <Card>
          <Label>Voice vs Video Detections</Label>
          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.teal }}>{voicePct}%</div>
              <div style={{ fontSize: 11, color: C.muted }}>Voice</div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.blue }}>{videoPct}%</div>
              <div style={{ fontSize: 11, color: C.muted }}>Video</div>
            </div>
          </div>
          <MiniBar items={[
            { label: "Voice", pct: voicePct, color: C.teal },
            { label: "Video", pct: videoPct, color: C.blue },
          ]} />
        </Card>
        <Card>
          <Label>Trust Score Trend</Label>
          <MiniLine data={trendData.length > 1 ? trendData : [82, 82]} color={C.teal} />
          <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>
            Last {trendData.length} communications
          </div>
        </Card>
      </div>
    </div>
  );
}

function MiniBar({ items }) {
  return (
    <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map(i => (
        <div key={i.label}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: 11, color: C.muted, marginBottom: 3
          }}>
            <span>{i.label}</span><span>{i.pct}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: C.border }}>
            <div style={{
              height: "100%", width: `${i.pct}%`, borderRadius: 2, background: i.color,
              transition: "width 1s ease"
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniLine({ data, color }) {
  const max = Math.max(...data), min = Math.min(...data);
  const W = 180, H = 48;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / (max - min || 1)) * H;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2}
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LIVE ANALYSIS
// ══════════════════════════════════════════════════════════════════════════════
function LiveAnalysis() {
  const [running, setRunning] = useState(false);
  const [demo, setDemo] = useState("normal");
  const [score, setScore] = useState(82);
  const [conf, setConf] = useState(90);
  const [voice, setVoice] = useState("ok");
  const [video, setVideo] = useState("ok");
  const [sync, setSync] = useState(96);
  const [prov, setProv] = useState("unavailable");
  const [elapsed, setElapsed] = useState(0);
  const [events, setEvents] = useState([]);
  const [changed, setChanged] = useState(null);
  const [micActive, setMicActive] = useState(false);
  const [callerVideoUrl, setCallerVideoUrl] = useState(null);
  const [classification, setClassification] = useState("UNCERTAIN");
  const [classConfidence, setClassConfidence] = useState(0);
  const [videoScore, setVideoScore] = useState(0);
  const [audioScore, setAudioScore] = useState(0);
  const [facesDetected, setFacesDetected] = useState(0);
  const [isSimulatedCaller, setIsSimulatedCaller] = useState(false);
  const [resetHighlight, setResetHighlight] = useState(false);
  const [showVerifyBanner, setShowVerifyBanner] = useState(false);

  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const dataArrayRef = useRef(null);
  const streamRef = useRef(null);
  const callerFileInputRef = useRef(null);
  const freqAnalyserRef = useRef(null);
  const freqDataRef = useRef(null);
  const wsRef = useRef(null);
  const isAttackingRef = useRef(false);

  const DEMO_MODES = {
    normal: { score: 84, voice: "ok", video: "ok", sync: 96, label: "Normal Call" },
    synth: { score: 48, voice: "warn", video: "ok", sync: 91, label: "Synthetic Voice" },
    video: { score: 32, voice: "warn", video: "warn", sync: 74, label: "Manipulated Video" },
    av: { score: 21, voice: "bad", video: "bad", sync: 38, label: "A/V Attack" },
  };

  function getReasons(d) {
    if (d === "synth") return ["Voice spectral anomaly detected", "Synthetic speech signature"];
    if (d === "video") return ["Voice spectral anomaly", "Facial motion inconsistency"];
    if (d === "av") return ["Voice AI signature", "Facial temporal anomaly", "A/V sync loss"];
    return [];
  }

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (micActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(err => console.log("Video play error:", err));
    }
  }, [micActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let t = 0;

    const draw = () => {
      const W = canvas.width = canvas.offsetWidth;
      const H = canvas.height = 56;
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = riskColor(score);
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      if (micActive && analyserRef.current && dataArrayRef.current) {
        const dataArray = dataArrayRef.current;
        analyserRef.current.getByteTimeDomainData(dataArray);
        const bufferLength = dataArray.length;
        for (let i = 0; i < W; i++) {
          const index = Math.floor((i / W) * bufferLength);
          const v = (dataArray[index] - 128) / 128;
          const y = H / 2 + v * (H / 2.5) * 3;
          i === 0 ? ctx.moveTo(i, y) : ctx.lineTo(i, y);
        }
      } else {
        for (let x = 0; x <= W; x++) {
          const phase = (x / W) * Math.PI * 20 + t;
          const amp = running ? (20 + Math.sin(x / 30) * 8) * (score / 100) : 4;
          const y = H / 2 + Math.sin(phase) * amp * (0.7 + Math.sin(x / 50 + t) * 0.3);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        t += running ? 0.08 : 0.01;
      }
      ctx.stroke();
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [score, running, micActive]);

  useEffect(() => {
    if (!micActive) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const ws = new WebSocket("ws://localhost:8000/ws/analyze");
    wsRef.current = ws;

    ws.onopen = () => console.log("🔌 Connected to AI backend");

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (isAttackingRef.current) return;
        if (typeof data.trust_score !== "number") return;

        const newScore = data.trust_score;
        setScore((prev) => {
          if (prev - newScore > 15) {
            setChanged({
              from: prev,
              to: newScore,
              reasons: data.signals.length > 0 ? data.signals : ["AI analysis detected anomaly"],
            });
          }
          return newScore;
        });

        if (newScore < 45) {
          setVoice("bad"); setVideo("bad"); setSync(40);
        } else if (newScore < 70) {
          setVoice("warn"); setVideo("warn"); setSync(75);
        } else {
          setVoice("ok"); setVideo("ok"); setSync(96);
        }

        if (data.classification) {
          setClassification(data.classification);
          setClassConfidence(data.class_confidence || 0);
          setVideoScore(data.video_score || 0);
          setAudioScore(data.audio_score || 0);
          setFacesDetected(data.faces_detected || 0);
        }
      } catch (e) {
        console.error("Parse error:", e);
      }
    };

    ws.onerror = (err) => console.error("WebSocket error:", err);
    ws.onclose = () => console.log("🔌 Disconnected from AI backend");

    const interval = setInterval(() => {
      if (!videoRef.current || !videoRef.current.videoWidth) return;
      if (ws.readyState !== WebSocket.OPEN) return;

      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const frameData = canvas.toDataURL("image/jpeg", 0.6);

      let rms = 0;
      let centroid = 0;

      if (analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          const v = (dataArrayRef.current[i] - 128) / 128;
          sum += v * v;
        }
        rms = Math.sqrt(sum / dataArrayRef.current.length);
      }

      if (freqAnalyserRef.current && freqDataRef.current) {
        freqAnalyserRef.current.getByteFrequencyData(freqDataRef.current);
        let numSum = 0, denomSum = 0;
        for (let i = 0; i < freqDataRef.current.length; i++) {
          numSum += i * freqDataRef.current[i];
          denomSum += freqDataRef.current[i];
        }
        centroid = denomSum > 0 ? numSum / denomSum : 0;
      }

      ws.send(JSON.stringify({
        type: "frame",
        data: frameData,
        audio: { rms: rms, centroid: centroid },
      }));
    }, 1000);

    return () => {
      clearInterval(interval);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [micActive]);

  const handleDemoClick = (mode) => {
    setDemo(mode);
    const m = DEMO_MODES[mode];
    setScore(m.score);
    setVoice(m.voice);
    setVideo(m.video);
    setSync(m.sync);
    const currentScore = score;
    if (currentScore - m.score > 10) {
      setChanged({ from: currentScore, to: m.score, reasons: getReasons(mode) });
      setEvents(prev => [
        { time: elapsed, label: getReasons(mode)[0] || "Signal detected" },
        ...prev.slice(0, 4)
      ]);
    }
  };

  const startLiveCall = async () => {
    isAttackingRef.current = false;
    if (callerVideoUrl) {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = callerVideoUrl;
        videoRef.current.loop = true;
        videoRef.current.muted = false;
        videoRef.current.volume = 1.0;
        videoRef.current.load();
        try {
          await videoRef.current.play();
        } catch (err) {
          console.log("Trying muted autoplay first:", err);
          videoRef.current.muted = false;
          await videoRef.current.play();
          setTimeout(() => {
            videoRef.current.muted = false;
            videoRef.current.volume = 1.0;
          }, 200);
        }
      }
      setIsSimulatedCaller(true);
      setMicActive(true);
      setRunning(true);
      setChanged(null);
      setEvents([]);
      setElapsed(0);
      setScore(82);
      setVoice("ok");
      setVideo("ok");
      setSync(96);
      setDemo("normal");
      console.log("📹 Simulated caller feed started");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: 320, height: 240 },
      });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      const freqAnalyser = audioContext.createAnalyser();
      freqAnalyser.fftSize = 1024;
      source.connect(freqAnalyser);
      freqAnalyserRef.current = freqAnalyser;
      freqDataRef.current = new Uint8Array(freqAnalyser.frequencyBinCount);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      setRunning(true);
      setChanged(null);
      setEvents([]);
      setElapsed(0);
      setScore(84);
      setVoice("ok");
      setVideo("ok");
      setSync(96);
      setDemo("normal");
      setMicActive(true);
    } catch (err) {
      console.error("ERROR starting call:", err);
      alert("Microphone or camera access denied. Please allow permissions.");
    }
  };

  const endLiveCall = () => {
    // 1. Kill all media tracks (turns off camera light)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    // 2. Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    // 3. Clear video element
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute("src");
      videoRef.current.src = "";
      videoRef.current.load();
    }

    // 4. Reset UI
    setCallerVideoUrl(null);
    setIsSimulatedCaller(false);
    setMicActive(false);
    setRunning(false);
    setScore(82);
    setChanged(null);
  };

  const triggerAttack = () => {
    const synth = window.speechSynthesis;
    if (synth.speaking) synth.cancel();
    const utterance = new SpeechSynthesisUtterance(
      "This is an artificial intelligence generated voice attempting to bypass your security."
    );
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    utterance.volume = 1;
    synth.speak(utterance);

    const attackReasons = [
      "Voice AI signature detected (synthetic speech)",
      "Facial temporal anomaly detected",
      "A/V sync loss"
    ];
    setScore(21);
    fetch("http://localhost:8000/api/set-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: 21 })
    });
    isAttackingRef.current = true;
    setVoice("bad");
    setVideo("bad");
    setSync(38);
    setChanged({ from: 82, to: 21, reasons: attackReasons });
    setEvents(prev => [
      { time: elapsed, label: "AI Voice signature detected" },
      ...prev.slice(0, 4)
    ]);

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    fetch("http://localhost:5001/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "Video call",
        time: timeString,
        trust: 21,
        confidence: 91,
        duration: `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`,
        signals: attackReasons
      })
    })
      .then(res => res.json())
      .then(data => console.log("✅ Live attack saved:", data))
      .catch(err => console.error("❌ Failed to save attack:", err));
  };

  const resetCall = () => {
    isAttackingRef.current = false;
    setScore(84);
    fetch("http://localhost:8000/api/set-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: 84 })
    });
    setVoice("ok");
    setVideo("ok");
    setSync(96);
    setChanged(null);
    setDemo("normal");
    setResetHighlight(true);
    setTimeout(() => setResetHighlight(false), 1500);
  };

  const handleVerifyCaller = () => {
    setShowVerifyBanner(true);
    setScore(84);
    setVoice("ok");
    setVideo("ok");
    setSync(96);
    setChanged(null);
    setDemo("normal");
    setEvents([]);
    setTimeout(() => setShowVerifyBanner(false), 4000);
  };

  const handleEndCall = () => {
    endLiveCall();
    setScore(82);
    setChanged(null);
    setEvents([]);
    setElapsed(0);
  };

  const handleReport = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    fetch("http://localhost:5001/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "Video call",
        platform: "Live Analysis",
        signal: "AI voice synthesis",
        desc: `Trust score dropped from 82 to 21 during live call at ${timeString}. Attack signals: ${(changed?.reasons || []).join(", ")}`
      })
    })
      .then(res => res.json())
      .then(data => {
        console.log("✅ Live attack reported:", data);
        alert("✓ Report submitted to Trust Network.");
        setChanged(null);
      })
      .catch(err => {
        console.error("❌ Failed to submit report:", err);
        alert("Failed to submit report. Check that the backend is running.");
      });
  };

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <Heading size={22}>Live Analysis</Heading>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
            Real-time communication trust monitoring
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {!micActive ? (
            <button onClick={startLiveCall}
              style={{
                background: C.teal, color: "#fff", border: "none",
                borderRadius: 8, padding: "0.6rem 1.25rem", fontWeight: 600, fontSize: 13,
                cursor: "pointer"
              }}>
              Start Live Call
            </button>
          ) : (
            <button onClick={endLiveCall}
              style={{
                background: C.redBg, color: C.red, border: `1px solid ${C.red}44`,
                borderRadius: 8, padding: "0.6rem 1.25rem", fontWeight: 600, fontSize: 13,
                cursor: "pointer"
              }}>
              End Call
            </button>
          )}
        </div>
      </div>

      <input
        ref={callerFileInputRef}
        type="file"
        accept="video/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            const url = URL.createObjectURL(file);
            setCallerVideoUrl(url);
            console.log("📥 Caller video loaded:", file.name);
          }
        }}
      />
      <button
        onClick={() => callerFileInputRef.current.click()}
        style={{
          background: isSimulatedCaller ? C.amberBg : "transparent",
          color: isSimulatedCaller ? C.amber : C.muted,
          border: `1px solid ${isSimulatedCaller ? C.amber : C.border}`,
          borderRadius: 8, padding: "0.6rem 1.25rem", fontWeight: 600, fontSize: 13,
          cursor: "pointer", width: "100%"
        }}
      >
        {callerVideoUrl ? "✓ Caller Video Loaded" : "📥 Load Caller Video"}
      </button>

      <Card style={{ padding: "0.75rem 1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: C.muted }}>Demo Mode:</span>
          {Object.entries(DEMO_MODES).map(([k, v]) => (
            <button key={k} onClick={() => handleDemoClick(k)}
              style={{
                padding: "0.3rem 0.75rem", borderRadius: 6, fontSize: 12, fontWeight: 600,
                cursor: "pointer", border: `1px solid ${demo === k ? C.teal : C.border}`,
                background: demo === k ? `${C.teal}20` : "transparent",
                color: demo === k ? C.teal : C.muted
              }}>
              {v.label}
            </button>
          ))}
          <span style={{ width: 1, height: 24, background: C.border, margin: "0 4px" }} />
          <button onClick={triggerAttack}
            style={{
              padding: "0.3rem 0.75rem", borderRadius: 6, fontSize: 12, fontWeight: 600,
              cursor: "pointer", background: C.redBg, color: C.red,
              border: `1px solid ${C.red}44`
            }}>
            ⚡ Simulate AI Attack
          </button>
          <button onClick={resetCall}
            style={{
              padding: "0.3rem 0.75rem", borderRadius: 6, fontSize: 12, fontWeight: 600,
              cursor: "pointer",
              background: resetHighlight ? C.greenBg : "transparent",
              color: resetHighlight ? C.green : C.muted,
              border: `1px solid ${resetHighlight ? C.green : C.border}`,
              boxShadow: resetHighlight ? `0 0 20px ${C.green}44` : "none",
              transition: "all 0.3s ease"
            }}>
            Reset Call
          </button>
          {micActive && (
            <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>
              ● LIVE MIC / CAM
            </span>
          )}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.25rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{
              position: "relative", background: "#0a0c10",
              aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <video
                ref={videoRef}
                style={{
                  width: "100%", height: "100%", objectFit: "contain",
                  transform: isSimulatedCaller ? "none" : "scaleX(-1)",
                  display: micActive ? "block" : "none"
                }}
                muted={false}
                playsInline
                autoPlay
              />
              {!micActive && (
                <div style={{ position: "absolute", fontSize: 13, color: C.muted }}>
                  Start a live call to see yourself
                </div>
              )}
              {running && (
                <div style={{
                  position: "absolute", inset: 0, border: `2px solid ${riskColor(score)}22`,
                  borderRadius: 12, boxShadow: `inset 0 0 40px ${riskColor(score)}08`, pointerEvents: "none"
                }} />
              )}
              <svg width="160" height="160" viewBox="0 0 160 160" opacity={running ? 0.5 : 0.2}
                style={{ position: "absolute", pointerEvents: "none" }}>
                <ellipse cx="80" cy="72" rx="44" ry="54" fill="none" stroke={riskColor(score)} strokeWidth="0.8" />
                <line x1="80" y1="18" x2="80" y2="126" stroke={riskColor(score)} strokeWidth="0.5" opacity="0.4" />
                <line x1="36" y1="72" x2="124" y2="72" stroke={riskColor(score)} strokeWidth="0.5" opacity="0.4" />
                <ellipse cx="80" cy="72" rx="20" ry="24" fill="none" stroke={riskColor(score)} strokeWidth="0.5" opacity="0.5" />
                <circle cx="80" cy="72" r="3" fill={riskColor(score)} opacity="0.8" />
                <circle cx="62" cy="60" r="4" fill="none" stroke={riskColor(score)} strokeWidth="0.8" />
                <circle cx="98" cy="60" r="4" fill="none" stroke={riskColor(score)} strokeWidth="0.8" />
                <path d="M66 90 Q80 100 94 90" fill="none" stroke={riskColor(score)} strokeWidth="0.8" />
              </svg>
              {running && (
                <div style={{
                  position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.6)",
                  borderRadius: 6, padding: "4px 10px", fontSize: 13, color: C.text,
                  fontVariantNumeric: "tabular-nums", fontFamily: "monospace"
                }}>
                  {fmt(elapsed)}
                </div>
              )}
              {running && (
                <div style={{
                  position: "absolute", top: 12, right: 12,
                  background: riskBg(score), border: `1px solid ${riskColor(score)}44`,
                  borderRadius: 6, padding: "4px 10px", fontSize: 12,
                  color: riskColor(score), fontWeight: 700, letterSpacing: "0.08em"
                }}>
                  {riskLabel(score)}
                </div>
              )}
            </div>
            <div style={{ padding: "0.75rem 1rem", borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>
                Audio Signal {micActive ? "(Live Mic)" : "(Simulated)"}
              </div>
              <canvas ref={canvasRef} style={{ width: "100%", height: 56, display: "block" }} />
            </div>
          </Card>

          {showVerifyBanner && (
            <Card style={{
              border: `1px solid ${C.green}44`, background: C.greenBg,
              padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: 12
            }}>
              <span style={{ fontSize: 18, color: C.green }}>✓</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.green }}>
                  Verification requested
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                  Trust score reset to 84. Caller has been asked to complete a verification challenge.
                </div>
              </div>
              <button
                onClick={() => setShowVerifyBanner(false)}
                style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 16 }}>
                ×
              </button>
            </Card>
          )}

          {changed && (
            <Card style={{ border: `1px solid ${C.amber}44`, background: `${C.amber}06` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 14, color: C.amber }}>⚠</span>
                <Heading size={14}>What Changed?</Heading>
              </div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 10 }}>
                Trust Score dropped{" "}
                <span style={{ color: C.text, fontWeight: 600 }}>{changed.from} → {changed.to}</span>
              </div>
              {changed.reasons.map((r, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "0.4rem 0.6rem", borderRadius: 6, background: C.border + "44",
                  marginBottom: 4, fontSize: 12, color: C.amber
                }}>
                  <span>◆</span> {r}
                </div>
              ))}
              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button onClick={handleVerifyCaller}
                  style={{
                    padding: "0.4rem 0.75rem", fontSize: 12, fontWeight: 600,
                    borderRadius: 6, cursor: "pointer",
                    background: C.teal, color: "#fff", border: `1px solid ${C.teal}`
                  }}>
                  Verify Caller
                </button>
                <button onClick={handleEndCall}
                  style={{
                    padding: "0.4rem 0.75rem", fontSize: 12, fontWeight: 600,
                    borderRadius: 6, cursor: "pointer",
                    background: "transparent", color: C.muted, border: `1px solid ${C.border}`
                  }}>
                  End Call
                </button>
                <button onClick={handleReport}
                  style={{
                    padding: "0.4rem 0.75rem", fontSize: 12, fontWeight: 600,
                    borderRadius: 6, cursor: "pointer",
                    background: C.redBg, color: C.red, border: `1px solid ${C.red}44`
                  }}>
                  Report
                </button>
              </div>
            </Card>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Card style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
            <TrustOrb score={score} size={140} animate />
          </Card>

          {[
            { label: "Voice Analysis", status: voice },
            { label: "Video Analysis", status: video },
          ].map(m => (
            <Card key={m.label} style={{ padding: "0.75rem 1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Label>{m.label}</Label>
                <SignalDot status={m.status} />
              </div>
            </Card>
          ))}

          <Card style={{ padding: "0.75rem 1rem" }}>
            <Label>A/V Synchronization</Label>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{
                fontSize: 22, fontWeight: 700,
                color: sync < 70 ? C.red : sync < 85 ? C.amber : C.green
              }}>
                {sync}%
              </div>
              {sync < 80 && (
                <div style={{ fontSize: 11, color: C.red, fontWeight: 600 }}>SYNC ANOMALY</div>
              )}
            </div>
            <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: C.border }}>
              <div style={{
                height: "100%", width: `${sync}%`, borderRadius: 2,
                background: sync < 70 ? C.red : sync < 85 ? C.amber : C.green,
                transition: "width 0.6s ease"
              }} />
            </div>
          </Card>

          <Card style={{ padding: "0.75rem 1rem" }}>
            <Label>Media Provenance</Label>
            <div style={{ fontSize: 12, color: C.muted }}>
              {prov === "unavailable"
                ? "Provenance unavailable — cannot verify content credentials."
                : "Provenance verified."}
            </div>
            <div style={{ marginTop: 6 }}><SignalDot status="info" /></div>
          </Card>

          <Card style={{ padding: "0.75rem 1rem" }}>
            <Label>Confidence</Label>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.teal }}>{conf}%</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Analysis confidence level</div>
          </Card>

          <Card style={{
            padding: "0.75rem 1rem",
            border: `1px solid ${classification === "LIKELY HUMAN" ? C.green + "44" :
              classification === "LIKELY AI-GENERATED" ? C.red + "44" : C.amber + "44"
              }`,
            background: classification === "LIKELY HUMAN" ? C.greenBg :
              classification === "LIKELY AI-GENERATED" ? C.redBg : C.amberBg
          }}>
            <Label>Deepfake Classification</Label>
            <div style={{
              fontSize: 15, fontWeight: 700, letterSpacing: "0.05em",
              color: classification === "LIKELY HUMAN" ? C.green :
                classification === "LIKELY AI-GENERATED" ? C.red : C.amber
            }}>
              {classification}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
              Confidence: <span style={{ color: C.text, fontWeight: 600 }}>{classConfidence}%</span>
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 6, fontFamily: "monospace", opacity: 0.7 }}>
              V:{videoScore} A:{audioScore} F:{facesDetected}
            </div>
          </Card>
        </div>
      </div>

      {running && events.length > 0 && (
        <Card>
          <Heading style={{ marginBottom: "0.75rem" }}>Suspicious Events</Heading>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {events.map((e, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "0.5rem 0.75rem", borderRadius: 8, background: C.amberBg,
                border: `1px solid ${C.amber}22`, fontSize: 12
              }}>
                <span style={{ color: C.amber, fontFamily: "monospace", minWidth: 40 }}>
                  {fmt(e.time)}
                </span>
                <span style={{ color: C.text }}>{e.label}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ANALYZE MEDIA
// ══════════════════════════════════════════════════════════════════════════════
function AnalyzeMedia() {
  const [stage, setStage] = useState("idle");
  const [file, setFile] = useState(null);
  const [step, setStep] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const STAGES = ["Uploading", "Processing", "Voice Analysis", "Video Analysis", "A/V Sync", "Provenance", "Trust Assessment"];
  const [result, setResult] = useState(null);

  function generateRandomResult() {
    const trust = Math.floor(Math.random() * 60) + 20;
    const confidence = Math.floor(Math.random() * 15) + 85;
    const isHighRisk = trust < 45;
    const isSuspicious = trust >= 45 && trust < 70;
    const allSignals = ["Voice characteristics inconsistent with natural speech", "Facial movement anomaly detected", "Audio-video timing mismatch observed", "Synthetic speech signature detected", "Temporal inconsistency in video frames", "Unnatural eye blinking pattern"];
    const numSignals = Math.floor(Math.random() * 3) + 1;
    const shuffled = [...allSignals].sort(() => 0.5 - Math.random());
    const signals = shuffled.slice(0, numSignals);

    return {
      trust, confidence,
      risk: isHighRisk ? "HIGH" : isSuspicious ? "SUSPICIOUS" : "LOW",
      voice: isHighRisk ? "bad" : isSuspicious ? "warn" : "ok",
      video: isHighRisk ? "bad" : isSuspicious ? "warn" : "ok",
      sync: isHighRisk ? 38 : isSuspicious ? 72 : 96,
      prov: "unavailable",
      moments: [{ time: "02:31", type: signals[0] || "Voice anomaly" }, { time: "03:12", type: signals[1] || "Lip-sync anomaly" }, { time: "04:07", type: signals[2] || "Facial temporal anomaly" }],
      signals: signals
    };
  }

  function startAnalysis(f) {
    setFile(f); setStage("uploading"); setStep(0);
    const newResult = generateRandomResult();
    setResult(newResult);
    const advance = (i) => {
      setTimeout(() => {
        setStep(i);
        if (i < STAGES.length - 1) advance(i + 1);
        else {
          setStage("done");
          const now = new Date();
          const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          fetch("http://localhost:5001/api/history", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: f.name.endsWith(".mp4") || f.name.endsWith(".mov") ? "Video call" : "Voice call", time: timeString, trust: newResult.trust, confidence: newResult.confidence, duration: "N/A", signals: newResult.signals })
          }).then(res => res.json()).then(data => console.log("✅ Analysis saved:", data)).catch(err => console.error("❌ Failed to save:", err));
        }
      }, 600 + i * 400);
    };
    advance(0);
  }

  function handleDrop(e) { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) startAnalysis(f); }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <Heading size={22}>Analyze Media</Heading>
      {stage === "idle" && (
        <Card style={{ border: `2px dashed ${dragOver ? C.teal : C.border}`, background: dragOver ? `${C.teal}08` : C.card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 280, gap: "1rem", transition: "all 0.2s", cursor: "pointer" }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} onClick={() => startAnalysis({ name: "demo_sample.mp4" })}>
          <div style={{ fontSize: 40, opacity: 0.3 }}>◈</div>
          <Heading size={16}>Drop media here or click to analyze</Heading>
          <div style={{ fontSize: 12, color: C.muted }}>Supports video, audio, and image files</div>
          <div style={{ display: "flex", gap: 8 }}>{["VIDEO", "AUDIO", "IMAGE"].map(t => (<span key={t} style={{ padding: "0.25rem 0.75rem", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 11, color: C.muted, letterSpacing: "0.08em" }}>{t}</span>))}</div>
        </Card>
      )}
      {(stage === "uploading" || stage === "processing") && (
        <Card>
          <Heading size={16} style={{ marginBottom: "1.25rem" }}>Analyzing: {file?.name || "sample.mp4"}</Heading>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {STAGES.map((s, i) => {
              const done = i < step; const active = i === step;
              return (<div key={s} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, border: `1.5px solid ${done ? C.green : active ? C.teal : C.border}`, background: done ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.4s" }}>
                  {done && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
                  {active && (<div style={{ width: 8, height: 8, borderRadius: "50%", background: C.teal, animation: "pulse 1s infinite" }} />)}
                </div>
                <div style={{ fontSize: 13, color: done ? C.green : active ? C.text : C.muted }}>{s}</div>
              </div>);
            })}
          </div>
        </Card>
      )}
      {stage === "done" && result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <Card style={{ border: `1px solid ${riskColor(result.trust)}44`, background: riskBg(result.trust) }}>
            <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
              <TrustOrb score={result.trust} size={120} />
              <div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>COMMUNICATION ANALYSIS</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: riskColor(result.trust), letterSpacing: "0.08em" }}>{riskLabel(result.trust)}</div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Confidence: <span style={{ color: C.text }}>{result.confidence}%</span></div>
                <div style={{ marginTop: 12, fontSize: 13, color: C.text, background: `${C.border}88`, borderRadius: 8, padding: "0.5rem 0.75rem" }}>
                  {result.trust >= 70 ? "No strong manipulation signals detected. Content appears authentic." : result.trust >= 45 ? "Some suspicious signals detected. Verify independently before trusting." : "Potential AI manipulation detected. Verify independently before trusting."}
                </div>
              </div>
            </div>
          </Card>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <Card>
              <Heading style={{ marginBottom: "0.75rem" }}>Findings</Heading>
              {[{ label: "Voice", status: result.voice }, { label: "Video", status: result.video }, { label: "A/V Sync", status: result.sync < 70 ? "bad" : result.sync < 85 ? "warn" : "ok" }, { label: "Provenance", status: "info" }].map(f => (
                <div key={f.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 13, color: C.muted }}>{f.label}</span>
                  <SignalDot status={f.status} />
                </div>
              ))}
            </Card>
            <Card>
              <Heading style={{ marginBottom: "0.75rem" }}>Suspicious Moments</Heading>
              {result.moments.map((m, i) => (<div key={i} style={{ display: "flex", gap: 12, padding: "0.5rem 0.75rem", borderRadius: 8, background: C.amberBg, border: `1px solid ${C.amber}22`, marginBottom: 6, fontSize: 12 }}><span style={{ color: C.amber, fontFamily: "monospace" }}>{m.time}</span><span style={{ color: C.text }}>{m.type}</span></div>))}
            </Card>
          </div>
          <Card>
            <Heading style={{ marginBottom: "0.75rem" }}>Detected Signals</Heading>
            {result.signals.map((s, i) => (<div key={i} style={{ fontSize: 13, color: C.muted, padding: "0.4rem 0.75rem", borderRadius: 6, borderLeft: `2px solid ${riskColor(result.trust)}`, marginBottom: 6, background: `${riskColor(result.trust)}06` }}>{s}</div>))}
            <div style={{ marginTop: 8, padding: "0.75rem", background: `${C.blue}08`, borderRadius: 8, fontSize: 12, color: C.muted, border: `1px solid ${C.blue}22` }}>
              <strong style={{ color: C.text }}>What Trust Lens cannot determine:</strong>{" "} Whether the content is criminal, who created it, or the intent behind it.
            </div>
          </Card>
          <Card style={{ display: "flex", gap: 10 }}>
            {["Verify Caller", "End Communication", "Report"].map((a, i) => (<button key={a} style={{ padding: "0.6rem 1.25rem", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", flex: 1, background: i === 0 ? C.teal : "transparent", color: i === 0 ? "#fff" : C.muted, border: `1px solid ${i === 0 ? C.teal : C.border}` }}>{a}</button>))}
          </Card>
          <button onClick={() => { setStage("idle"); setFile(null); setStep(0); setResult(null); }} style={{ alignSelf: "flex-start", background: "transparent", border: "none", color: C.muted, fontSize: 13, cursor: "pointer" }}>← Analyze another file</button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// INSIGHTS
// ══════════════════════════════════════════════════════════════════════════════
function Insights() {
  const [insightsData, setInsightsData] = useState([]);
  const [reportCount, setReportCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetch("http://localhost:5001/api/history").then(res => res.json()), fetch("http://localhost:5001/api/reports").then(res => res.json())])
      .then(([history, reports]) => { setInsightsData(history); setReportCount(reports.length); setLoading(false); })
      .catch(err => { console.error("Failed to fetch insights:", err); setLoading(false); });
  }, []);

  if (loading) return <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}><Heading size={22}>Insights</Heading><Card><div style={{ color: C.muted }}>Loading analytics...</div></Card></div>;

  const totalAnalyzed = insightsData.length;
  const suspicious = insightsData.filter(h => h.trust < 70 && h.trust >= 45).length;
  const highRisk = insightsData.filter(h => h.trust < 45).length;
  const voiceOnly = insightsData.filter(h => h.type === "Voice call").length;
  const videoOnly = insightsData.filter(h => h.type === "Video call" && !h.signals.some(s => s.toLowerCase().includes("voice"))).length;
  const both = insightsData.filter(h => h.type === "Video call" && h.signals.some(s => s.toLowerCase().includes("voice"))).length;

  const chartData = insightsData.slice(0, 12).reverse().map(h => h.trust);
  const chartLabels = insightsData.slice(0, 12).reverse().map(h => { const d = new Date(h.created_at); return `${d.getMonth() + 1}/${d.getDate()}`; });
  const signalCounts = {};
  insightsData.forEach(h => { const signals = h.signals || []; signals.forEach(s => { signalCounts[s] = (signalCounts[s] || 0) + 1; }); });
  const topSignals = Object.entries(signalCounts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([label, count]) => ({ label, count, pct: Math.round((count / totalAnalyzed) * 100) }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <Heading size={22}>Insights</Heading>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[{ label: "Analyzed", value: totalAnalyzed, color: C.teal }, { label: "Suspicious", value: suspicious, color: C.amber }, { label: "High Risk", value: highRisk, color: C.red }, { label: "Reports", value: reportCount, color: C.blue }].map(s => (<Card key={s.label}><Label>{s.label}</Label><div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div></Card>))}
      </div>
      <Card><Heading style={{ marginBottom: "1rem" }}>Trust Score — Recent Communications</Heading><BarChart data={chartData} labels={chartLabels} /></Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
        <Card>
          <Heading style={{ marginBottom: "0.75rem" }}>Most Common Signals</Heading>
          {topSignals.map((s, i) => (<div key={i} style={{ marginBottom: 12 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted, marginBottom: 4 }}><span>{s.label}</span><span>{s.count} events</span></div><div style={{ height: 6, borderRadius: 3, background: C.border }}><div style={{ height: "100%", width: `${s.pct}%`, borderRadius: 3, background: `linear-gradient(90deg, ${C.teal}, ${C.blue})` }} /></div></div>))}
        </Card>
        <Card>
          <Heading style={{ marginBottom: "0.75rem" }}>Detection Breakdown</Heading>
          <DonutChart segments={[{ label: "Voice Only", value: voiceOnly, color: C.teal }, { label: "Video Only", value: videoOnly, color: C.blue }, { label: "Both", value: both, color: C.amber }]} />
        </Card>
      </div>
    </div>
  );
}

function BarChart({ data, labels }) {
  const max = Math.max(...data);
  return (<div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>{data.map((v, i) => (<div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}><div style={{ width: "100%", borderRadius: "3px 3px 0 0", height: `${(v / max) * 100}%`, background: riskColor(v), opacity: 0.8, minHeight: 4, transition: "height 1s ease" }} /><div style={{ fontSize: 10, color: C.muted }}>{labels[i]}</div></div>))}</div>);
}

function DonutChart({ segments }) {
  const total = segments.reduce((a, s) => a + s.value, 0); let offset = 0;
  const R = 50, CX = 65, CY = 65, circ = 2 * Math.PI * R;
  return (<div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}><svg width={130} height={130} viewBox="0 0 130 130">{segments.map((s, i) => { const pct = s.value / total; const dash = circ * pct - 2; const elem = (<circle key={i} cx={CX} cy={CY} r={R} fill="none" stroke={s.color} strokeWidth={18} strokeLinecap="round" strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset * circ + circ / 4} style={{ transition: "all 1s ease" }} />); offset += pct; return elem; })}<circle cx={CX} cy={CY} r={R - 10} fill={C.card} /><text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill={C.muted}>total</text><text x={CX} y={CY + 14} textAnchor="middle" dominantBaseline="middle" fontSize={18} fontWeight={700} fill={C.text}>{total}</text></svg><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{segments.map(s => (<div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: s.color }} /><span style={{ color: C.muted }}>{s.label}</span><span style={{ color: C.text, fontWeight: 600 }}>{s.value}</span></div>))}</div></div>);
}

// ══════════════════════════════════════════════════════════════════════════════
// HISTORY
// ══════════════════════════════════════════════════════════════════════════════
function History() {
  const [selected, setSelected] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5001/api/history").then(res => res.json()).then(data => { setHistoryData(data); setLoading(false); }).catch(err => { console.error("Failed to fetch history:", err); setLoading(false); });
  }, []);

  if (loading) return <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}><Heading size={22}>Communication History</Heading><Card><div style={{ color: C.muted }}>Loading history...</div></Card></div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <Heading size={22}>Communication History</Heading>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {historyData.map(h => (
          <Card key={h.id} onClick={() => setSelected(selected?.id === h.id ? null : h)} style={{ transition: "all 0.2s", border: `1px solid ${selected?.id === h.id ? riskColor(h.trust) + "66" : C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: riskBg(h.trust), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{h.type.startsWith("Video") ? "▣" : "◉"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{h.type}</span><span style={{ fontSize: 11, color: C.muted }}>{h.time}</span><span style={{ fontSize: 11, color: C.muted }}>·</span><span style={{ fontSize: 11, color: C.muted }}>{h.duration}</span></div>
                {h.signals.length > 0 && (<div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{h.signals.join(" · ")}</div>)}
              </div>
              <div style={{ textAlign: "right" }}><div style={{ fontSize: 22, fontWeight: 700, color: riskColor(h.trust) }}>{h.trust}</div><div style={{ fontSize: 11, color: riskColor(h.trust), letterSpacing: "0.06em" }}>{riskLabel(h.trust)}</div></div>
            </div>
            {selected?.id === h.id && (
              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", gap: "2rem" }}><div><Label>Confidence</Label><div style={{ color: C.text, fontWeight: 600 }}>{h.confidence}%</div></div><div><Label>Signals</Label><div style={{ color: C.text, fontWeight: 600 }}>{h.signals.length || "None"}</div></div><div><Label>Duration</Label><div style={{ color: C.text, fontWeight: 600 }}>{h.duration}</div></div></div>
                {h.signals.length > 0 && (<div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>{h.signals.map((s, i) => (<div key={i} style={{ fontSize: 12, color: C.amber, padding: "0.35rem 0.6rem", borderRadius: 6, background: C.amberBg, border: `1px solid ${C.amber}22` }}>{s}</div>))}</div>)}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════════════════════════════════════════
function Reports() {
  const [form, setForm] = useState({ type: "", platform: "", signal: "", desc: "" });
  const [submitted, setSubmitted] = useState(false);

  function submit() {
    if (!form.type || !form.signal) return;
    fetch("http://localhost:5001/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: form.type, platform: form.platform, signal: form.signal, desc: form.desc }) })
      .then(res => res.json()).then(data => { console.log("✅ Report saved:", data); setSubmitted(true); }).catch(err => { console.error("❌ Failed to save:", err); setSubmitted(true); });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <Heading size={22}>Report Suspicious Communication</Heading>
      {submitted ? (
        <Card style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: 40, color: C.green, marginBottom: "1rem" }}>✓</div>
          <Heading size={18}>Report Submitted</Heading>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 8, marginBottom: "1.5rem" }}>Trust Network Signal Added. This report indicates suspicious activity. It does not establish criminal intent or identity.</div>
          <button onClick={() => { setSubmitted(false); setForm({ type: "", platform: "", signal: "", desc: "" }); }} style={{ background: C.teal, color: "#fff", border: "none", borderRadius: 8, padding: "0.6rem 1.5rem", fontWeight: 600, cursor: "pointer" }}>Submit Another Report</button>
        </Card>
      ) : (
        <Card>
          <div style={{ padding: "0.75rem", background: `${C.amber}08`, border: `1px solid ${C.amber}22`, borderRadius: 8, marginBottom: "1.5rem", fontSize: 12, color: C.muted }}>This report indicates suspicious activity. It does not establish criminal intent or identify any individual as an attacker or criminal.</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {[{ key: "type", label: "Communication Type", options: ["Video call", "Voice call", "Video message", "Audio message"] }, { key: "platform", label: "Platform", options: ["Unknown", "Web", "Phone", "App", "Other"] }, { key: "signal", label: "Detected Signal", options: ["AI voice synthesis", "Voice cloning", "Deepfake video", "Lip-sync manipulation", "Other"] }].map(f => (
              <div key={f.key}>
                <Label>{f.label}</Label>
                <select value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "0.5rem 0.75rem", color: C.text, fontSize: 13 }}>
                  <option value="">Select...</option>{f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "1rem" }}><Label>Description (optional)</Label><textarea value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="Describe what made this communication suspicious..." style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "0.75rem", color: C.text, fontSize: 13, resize: "vertical", minHeight: 80, boxSizing: "border-box" }} /></div>
          <button onClick={submit} style={{ marginTop: "1rem", background: !form.type || !form.signal ? C.border : C.teal, color: !form.type || !form.signal ? C.muted : "#fff", border: "none", borderRadius: 8, padding: "0.6rem 1.5rem", fontWeight: 600, fontSize: 13, cursor: !form.type || !form.signal ? "not-allowed" : "pointer" }}>Submit Report</button>
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TRUST NETWORK
// ══════════════════════════════════════════════════════════════════════════════
function TrustNetwork() {
  const [reportsData, setReportsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("http://localhost:5001/api/reports").then(res => res.json()).then(data => { setReportsData(data); setLoading(false); }).catch(err => { console.error("Failed to fetch reports:", err); setLoading(false); }); }, []);

  if (loading) return <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}><Heading size={22}>Trust Network</Heading><Card><div style={{ color: C.muted }}>Loading community reports...</div></Card></div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div><Heading size={22}>Trust Network</Heading><div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Community-sourced suspicious communication signals</div></div>
        <div style={{ padding: "0.4rem 0.75rem", borderRadius: 8, background: C.greenBg, border: `1px solid ${C.green}22`, fontSize: 12, color: C.green, fontWeight: 600 }}>{reportsData.length} community signals</div>
      </div>
      <Card style={{ padding: "0.75rem 1rem", background: `${C.blue}06`, border: `1px solid ${C.blue}22` }}><div style={{ fontSize: 12, color: C.muted }}>Trust Network signals represent community-reported suspicious indicators. A reported identifier does not establish criminal intent or identity. Always verify independently.</div></Card>
      {reportsData.map(t => (
        <Card key={t.id}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
            <div><div style={{ fontSize: 12, fontFamily: "monospace", color: C.teal, marginBottom: 4 }}>{t.platform} - {t.type}</div><div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{t.signal}</div>{t.description && (<div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{t.description}</div>)}</div>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: 20, fontWeight: 700, color: C.amber }}>1</div><div style={{ fontSize: 11, color: C.muted }}>report</div></div>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 12, color: C.muted }}><span>Type: <span style={{ color: C.text }}>{t.type}</span></span><span>Confidence: <span style={{ color: C.text }}>85%</span></span><span>{new Date(t.created_at).toLocaleDateString()}</span></div>
          <div style={{ marginTop: 10, height: 4, borderRadius: 2, background: C.border }}><div style={{ height: "100%", width: "85%", borderRadius: 2, background: C.amber }} /></div>
        </Card>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LAB
// ══════════════════════════════════════════════════════════════════════════════
function Lab() {
  const [labData, setLabData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5001/api/history").then(res => res.json()).then(data => { setLabData(data.slice(0, 4)); if (data.length > 0) setSelectedId(data[0].id); setLoading(false); }).catch(err => { console.error("Failed to fetch lab data:", err); setLoading(false); });
  }, []);

  if (loading) return <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}><Heading size={22}>Trust Lens Lab</Heading><Card><div style={{ color: C.muted }}>Loading sample analyses...</div></Card></div>;
  if (labData.length === 0) return <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}><Heading size={22}>Trust Lens Lab</Heading><Card><div style={{ color: C.muted, textAlign: "center", padding: "2rem" }}>No analyses yet. Run an analysis in "Analyze Media" to see samples here.</div></Card></div>;

  const sample = labData.find(s => s.id === selectedId) || labData[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div><Heading size={22}>Trust Lens Lab</Heading><div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Real analyses from your history — study them to understand detection patterns</div></div>
      <Card style={{ background: `${C.teal}08`, border: `1px solid ${C.teal}44`, padding: "0.75rem 1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 11, color: C.muted, letterSpacing: "0.1em" }}>NOW VIEWING:</span><span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{sample.type}</span><span style={{ fontSize: 12, color: C.muted }}>·</span><span style={{ fontSize: 12, color: C.muted }}>{sample.time}</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 11, color: C.muted, fontFamily: "monospace" }}>ID: {sample.id.slice(0, 8)}</span><span style={{ fontSize: 12, fontWeight: 700, color: riskColor(sample.trust), padding: "3px 10px", borderRadius: 6, background: riskBg(sample.trust), border: `1px solid ${riskColor(sample.trust)}44` }}>{sample.trust} · {riskLabel(sample.trust)}</span></div>
        </div>
      </Card>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {labData.map(s => (<button key={s.id} onClick={() => setSelectedId(s.id)} style={{ flex: 1, padding: "0.5rem 0.75rem", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", minWidth: 120, background: selectedId === s.id ? riskBg(s.trust) : "transparent", color: selectedId === s.id ? riskColor(s.trust) : C.muted, border: `1px solid ${selectedId === s.id ? riskColor(s.trust) + "44" : C.border}` }}>{s.type} — {s.time}</button>))}
      </div>
      {sample && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "2rem" }}>
            <Label>{sample.type}</Label>
            <TrustOrb score={sample.trust} size={160} />
            <div style={{ textAlign: "center" }}><div style={{ fontWeight: 700, color: riskColor(sample.trust), letterSpacing: "0.1em" }}>{riskLabel(sample.trust)}</div><div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Confidence: {sample.confidence}%</div></div>
          </Card>
          <Card>
            <Heading style={{ marginBottom: "0.75rem" }}>Analysis</Heading>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: "1rem", padding: "0.6rem 0.75rem", borderRadius: 8, background: `${C.blue}08`, border: `1px solid ${C.blue}22` }}>{sample.trust >= 70 ? "Natural communication with no strong manipulation signals." : sample.trust >= 45 ? "Some suspicious signals detected. Verify independently." : "Multiple anomaly signals detected. Potential AI manipulation."}</div>
            {[{ label: "Voice Analysis", status: sample.trust >= 70 ? "ok" : sample.trust >= 45 ? "warn" : "bad" }, { label: "Video Analysis", status: sample.trust >= 70 ? "ok" : sample.trust >= 45 ? "warn" : "bad" }].map(m => (<div key={m.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: `1px solid ${C.border}` }}><span style={{ fontSize: 13, color: C.muted }}>{m.label}</span><SignalDot status={m.status} /></div>))}
            <div style={{ padding: "0.5rem 0", borderBottom: `1px solid ${C.border}` }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 13, color: C.muted }}>Detected Signals</span><span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{(sample.signals || []).length}</span></div></div>
            {sample.signals && sample.signals.length > 0 && (<div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>{sample.signals.map((s, i) => (<div key={i} style={{ fontSize: 11, color: C.amber, padding: "0.35rem 0.6rem", borderRadius: 6, background: C.amberBg, border: `1px solid ${C.amber}22` }}>{s}</div>))}</div>)}
            <div style={{ marginTop: 12, fontSize: 12, color: C.muted, fontStyle: "italic", padding: "0.5rem 0.75rem", borderRadius: 8, background: `${C.border}44` }}>These are real analyses from your database. Study patterns to understand detection behavior.</div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HARDWARE
// ══════════════════════════════════════════════════════════════════════════════
function Hardware() {
  const [connected, setConnected] = useState(false);
  const [ledState, setLedState] = useState("green");
  const [pir, setPir] = useState(true);
  const LED_MAP = { green: C.green, amber: C.amber, red: C.red, off: "#333" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div><Heading size={22}>Trust Lens Device</Heading><div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>ESP32 hardware security node</div></div>
        <button onClick={() => setConnected(c => !c)} style={{ background: connected ? C.greenBg : C.teal, color: connected ? C.green : "#fff", border: connected ? `1px solid ${C.green}44` : "none", borderRadius: 8, padding: "0.6rem 1.25rem", fontWeight: 600, cursor: "pointer" }}>{connected ? "Connected" : "Connect Device"}</button>
      </div>
      <Card style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><ESP32Visual ledState={connected ? ledState : "off"} pir={pir && connected} /></Card>
      {connected && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>
          <Card>
            <Label>LED State</Label>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>{Object.entries(LED_MAP).filter(([k]) => k !== "off").map(([k, v]) => (<button key={k} onClick={() => setLedState(k)} style={{ width: 28, height: 28, borderRadius: "50%", background: v, border: ledState === k ? `2px solid #fff` : "none", cursor: "pointer", boxShadow: ledState === k ? `0 0 12px ${v}` : "none" }} />))}</div>
          </Card>
          <Card>
            <Label>PIR Sensor</Label>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: pir ? C.green : C.red }} /><span style={{ fontSize: 13, color: C.text }}>{pir ? "Presence detected" : "No presence"}</span></div>
            <button onClick={() => setPir(p => !p)} style={{ marginTop: 8, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "0.3rem 0.6rem", color: C.muted, fontSize: 12, cursor: "pointer" }}>Toggle</button>
          </Card>
          <Card>
            <Label>OLED Status</Label>
            <div style={{ background: "#0a1a0a", border: `1px solid #1a3a1a`, borderRadius: 6, padding: "0.5rem 0.75rem", fontFamily: "monospace", fontSize: 11, color: C.green, marginTop: 6, lineHeight: 1.6 }}>TRUST LENS<br />Score: {ledState === "green" ? 84 : ledState === "amber" ? 51 : 22}<br />{ledState === "green" ? "LOW RISK" : ledState === "amber" ? "SUSPICIOUS" : "HIGH RISK"}</div>
          </Card>
        </div>
      )}
      {!connected && (<Card style={{ textAlign: "center", padding: "2rem" }}><div style={{ fontSize: 32, opacity: 0.3, marginBottom: "1rem" }}>◧</div><Heading size={15}>Trust Lens Node offline</Heading><div style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>Connect your ESP32 device to receive hardware alerts</div></Card>)}
      <Card>
        <Heading style={{ marginBottom: "1rem" }}>Signal Architecture</Heading>
        <div style={{ display: "flex", alignItems: "center", gap: 0, fontSize: 12, overflowX: "auto" }}>
          {["Call", "AI Analysis", "Trust Engine", "Wi-Fi", "ESP32", "LED / OLED / Buzzer"].map((s, i, arr) => (<div key={s} style={{ display: "flex", alignItems: "center" }}><div style={{ padding: "0.4rem 0.75rem", borderRadius: 6, background: C.border, color: C.text, whiteSpace: "nowrap", fontSize: 11 }}>{s}</div>{i < arr.length - 1 && (<div style={{ width: 20, height: 1, background: C.teal, flexShrink: 0, position: "relative" }}><div style={{ position: "absolute", right: -3, top: -4, color: C.teal, fontSize: 10 }}>▶</div></div>)}</div>))}
        </div>
      </Card>
    </div>
  );
}

function ESP32Visual({ ledState, pir }) {
  const ledColor = { green: C.green, amber: C.amber, red: C.red, off: "#333" }[ledState];
  return (
    <svg width="260" height="180" viewBox="0 0 260 180">
      <rect x="30" y="30" width="200" height="120" rx="8" fill="#1a2a1a" stroke="#2a4a2a" strokeWidth="1.5" />
      <rect x="80" y="55" width="100" height="70" rx="4" fill="#0d1a0d" stroke="#1a3a1a" strokeWidth="1" />
      <text x="130" y="88" textAnchor="middle" fontSize="10" fill="#2a5a2a" fontFamily="monospace">ESP32</text>
      <text x="130" y="102" textAnchor="middle" fontSize="8" fill="#1a3a1a" fontFamily="monospace">TRUST LENS NODE</text>
      <circle cx="50" cy="55" r="8" fill={ledColor} style={{ filter: ledState !== "off" ? `drop-shadow(0 0 6px ${ledColor})` : "none" }} />
      <text x="50" y="72" textAnchor="middle" fontSize="8" fill="#336633">LED</text>
      <circle cx="210" cy="55" r="10" fill={pir ? "#1a3a1a" : "#1a1a1a"} stroke="#2a5a2a" strokeWidth="1" />
      <circle cx="210" cy="55" r="5" fill={pir ? C.green : "#222"} style={{ opacity: pir ? 1 : 0.3 }} />
      <text x="210" y="72" textAnchor="middle" fontSize="8" fill="#336633">PIR</text>
      <rect x="50" y="110" width="60" height="30" rx="3" fill="#0a1a0a" stroke="#1a3a1a" strokeWidth="0.8" />
      <text x="55" y="122" fontSize="6" fill={C.green} fontFamily="monospace">TRUSTLENS</text>
      <text x="55" y="131" fontSize="6" fill={C.green} fontFamily="monospace">LOW RISK 84</text>
      {[0, 1, 2, 3, 4, 5].map(i => (<rect key={i} x={32} y={45 + i * 12} width={6} height={4} rx={1} fill="#333" />))}
      {[0, 1, 2, 3, 4, 5].map(i => (<rect key={i} x={222} y={45 + i * 12} width={6} height={4} rx={1} fill="#333" />))}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════════════════════════
function Settings() {
  const [settings, setSettings] = useState({ voice: true, video: true, avsync: true, provenance: true, visualAlerts: true, soundAlerts: false, hardwareAlerts: true, storeHistory: true, autoDelete: false, shareNetwork: true, localProcessing: true });
  const toggle = k => setSettings(s => ({ ...s, [k]: !s[k] }));
  const groups = [
    { label: "Detection", keys: ["voice", "video", "avsync", "provenance"], labels: ["Voice detection", "Video detection", "A/V synchronization", "Provenance check"] },
    { label: "Alerts", keys: ["visualAlerts", "soundAlerts", "hardwareAlerts"], labels: ["Visual alerts", "Sound alerts", "Hardware alerts (ESP32)"] },
    { label: "Privacy", keys: ["storeHistory", "autoDelete", "shareNetwork", "localProcessing"], labels: ["Store analysis history", "Auto-delete media after analysis", "Share reports with Trust Network", "Process locally when possible"] },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <Heading size={22}>Settings & Privacy</Heading>
      {groups.map(g => (
        <Card key={g.label}>
          <Heading style={{ marginBottom: "0.75rem" }}>{g.label}</Heading>
          {g.keys.map((k, i) => (
            <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.65rem 0", borderBottom: i < g.keys.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ fontSize: 13, color: C.text }}>{g.labels[i]}</span>
              <Toggle on={settings[k]} onClick={() => toggle(k)} />
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}

function Toggle({ on, onClick }) {
  return (
    <div onClick={onClick} style={{ width: 42, height: 24, borderRadius: 12, cursor: "pointer", background: on ? C.teal : C.border, position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [page, setPage] = useState("dashboard");

  const PAGES = {
    dashboard: <Dashboard setPage={setPage} />,
    live: <LiveAnalysis />,
    media: <AnalyzeMedia />,
    insights: <Insights />,
    history: <History />,
    reports: <Reports />,
    network: <TrustNetwork />,
    lab: <Lab />,
    hardware: <Hardware />,
    settings: <Settings />,
  };

  return (
    <div style={{ fontFamily: "Inter,-apple-system,sans-serif", background: C.bg, minHeight: "100vh", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        select, textarea { outline: none; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
      {!splashDone && <Splash onDone={() => setSplashDone(true)} />}
      <div style={{ display: "flex", opacity: splashDone ? 1 : 0, transition: "opacity 0.6s ease", minHeight: "100vh" }}>
        <Sidebar active={page} setActive={setPage} />
        <main style={{ flex: 1, padding: "2rem", maxWidth: 1100, overflowY: "auto" }}>
          {PAGES[page] || PAGES.dashboard}
        </main>
      </div>
    </div>
  );
}