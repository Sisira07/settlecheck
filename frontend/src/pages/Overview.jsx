import { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import AnimatedNumber from '../components/AnimatedNumber.jsx'

const STAGES = [
  { nodes: ['node0'], edges: [] },
  { nodes: ['node1'], edges: ['edge1'] },
  { nodes: ['node2'], edges: ['edge2'] },
  { nodes: ['node3'], edges: ['edge3'] },
  { nodes: ['node4a', 'node4b'], edges: ['edge4a', 'edge4b'] },
];

export default function Overview() {
  const { report } = useOutletContext();
  const [activeNodes, setActiveNodes] = useState(new Set());
  const [activeEdges, setActiveEdges] = useState(new Set());

  const play = useCallback(() => {
    setActiveNodes(new Set());
    setActiveEdges(new Set());
    STAGES.forEach((stage, i) => {
      setTimeout(() => {
        setActiveNodes(prev => new Set([...prev, ...stage.nodes]));
        setActiveEdges(prev => new Set([...prev, ...stage.edges]));
      }, i * 550);
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(play, 400); // auto-play once on arrival
    return () => clearTimeout(t);
  }, [play]);

  const isActive = (id) => activeNodes.has(id);
  const isFlowing = (id) => activeEdges.has(id);

  return (
    <section className="view active">
      <header className="view-head">
        <span className="eyebrow">System overview</span>
        <h1>Every rupee, matched or explained.</h1>
        <p className="lede">
          SettleCheck reconciles Razorpay settlements against internal orders — including the
          cases a simple lookup misses: one order paid out across several settlements, or several
          orders bundled into one payout. Nothing resolves unless it's certain. Everything else is
          logged, not guessed.
        </p>
      </header>

      <div className="pipeline-card">
        <div className="pipeline-card-head">
          <h2>The pipeline</h2>
          <button className="btn btn-ghost" onClick={play}>▶ Play flow</button>
        </div>

        <svg className="pipeline-svg" viewBox="0 0 1040 260" xmlns="http://www.w3.org/2000/svg">
          <line x1="90" y1="130" x2="950" y2="130" className="pl-spine" />

          <line id="edge1" x1="150" y1="130" x2="290" y2="130" className={`pl-edge ${isFlowing('edge1') ? 'flowing' : ''}`} />
          <line id="edge2" x1="350" y1="130" x2="470" y2="130" className={`pl-edge ${isFlowing('edge2') ? 'flowing' : ''}`} />
          <line id="edge3" x1="530" y1="130" x2="650" y2="130" className={`pl-edge ${isFlowing('edge3') ? 'flowing' : ''}`} />
          <line id="edge4a" x1="710" y1="105" x2="810" y2="60" className={`pl-edge ${isFlowing('edge4a') ? 'flowing' : ''}`} />
          <line id="edge4b" x1="710" y1="155" x2="810" y2="200" className={`pl-edge ${isFlowing('edge4b') ? 'flowing' : ''}`} />

          <g className={`pl-node ${isActive('node0') ? 'active' : ''}`}>
            <circle cx="90" cy="130" r="42" />
            <text x="90" y="124" className="pl-node-title">Orders +</text>
            <text x="90" y="140" className="pl-node-title">Settlements</text>
          </g>

          <g className={`pl-node ${isActive('node1') ? 'active' : ''}`}>
            <circle cx="320" cy="130" r="42" />
            <text x="320" y="118" className="pl-node-title">Pass 1</text>
            <text x="320" y="136" className="pl-node-sub">Exact match</text>
          </g>

          <g className={`pl-node ${isActive('node2') ? 'active' : ''}`}>
            <circle cx="500" cy="130" r="42" />
            <text x="500" y="118" className="pl-node-title">Pass 2</text>
            <text x="500" y="136" className="pl-node-sub">Subset-sum N:M</text>
          </g>

          <g className={`pl-node pl-node-gate ${isActive('node3') ? 'active' : ''}`}>
            <circle cx="680" cy="130" r="42" />
            <text x="680" y="118" className="pl-node-title">Confidence</text>
            <text x="680" y="136" className="pl-node-sub">Gate</text>
          </g>

          <g className={`pl-node pl-node-good ${isActive('node4a') ? 'active' : ''}`}>
            <circle cx="860" cy="60" r="36" />
            <text x="860" y="50" className="pl-node-title">Matches</text>
            <text x="860" y="66" className="pl-node-sub">logged</text>
          </g>

          <g className={`pl-node pl-node-warn ${isActive('node4b') ? 'active' : ''}`}>
            <circle cx="860" cy="200" r="36" />
            <text x="860" y="190" className="pl-node-title">Exceptions</text>
            <text x="860" y="206" className="pl-node-sub">+ LLM note</text>
          </g>
        </svg>

        <p className="pipeline-caption">
          Matching is entirely deterministic — Pass 1 and Pass 2 are plain Java, no model
          involved. An LLM only writes the explanation for an exception <em>after</em> the
          decision is already made.
        </p>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <span className="stat-label">Last match rate</span>
          <span className="stat-value">{report ? <AnimatedNumber value={report.matchRatePercent} suffix="%" /> : '—'}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Exact matches</span>
          <span className="stat-value">{report ? <AnimatedNumber value={report.exactMatches} /> : '—'}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Subset-sum matches</span>
          <span className="stat-value">{report ? <AnimatedNumber value={report.subsetSumMatches} /> : '—'}</span>
        </div>
        <div className="stat-card stat-card-warn">
          <span className="stat-label">Open exceptions</span>
          <span className="stat-value">{report ? <AnimatedNumber value={report.exceptionsRaised} /> : '—'}</span>
        </div>
      </div>
    </section>
  );
}
