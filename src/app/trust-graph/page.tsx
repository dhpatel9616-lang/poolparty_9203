'use client';
import React, { useState, useEffect } from 'react';
import MobileLayout from '@/components/MobileLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';

interface TrustRelationship {
  id: string;
  relationship_type: string;
  trust_score: number;
  interaction_count: number;
  last_interaction_at: string;
  connected_user: { full_name: string; username: string };
}

interface TrustCluster {
  id: string;
  cluster_name: string;
  cluster_key: string;
  member_count: number;
  avg_trust_score: number;
  cohesion_score: number;
}

interface GraphNode {
  id: string;
  name: string;
  trustScore: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

const REL_COLORS: Record<string, string> = {
  endorsed: 'var(--success)',
  flagged: 'var(--accent)',
  neutral: 'var(--muted-foreground)',
  blocked: '#ff4444',
};

function generateGraphNodes(relationships: TrustRelationship[], myScore: number): GraphNode[] {
  const centerX = 160;
  const centerY = 140;
  const radius = 90;
  const nodes: GraphNode[] = [
    { id: 'me', name: 'You', trustScore: myScore, x: centerX, y: centerY, size: 28, color: 'var(--primary)' },
  ];
  relationships.slice(0, 6).forEach((rel, i) => {
    const angle = (i / Math.min(relationships.length, 6)) * Math.PI * 2 - Math.PI / 2;
    const dist = radius + (rel.trust_score > 70 ? -15 : 15);
    nodes.push({
      id: rel.id,
      name: rel.connected_user.full_name.split(' ')[0],
      trustScore: rel.trust_score,
      x: centerX + Math.cos(angle) * dist,
      y: centerY + Math.sin(angle) * dist,
      size: Math.max(14, Math.min(22, rel.trust_score / 5)),
      color: REL_COLORS[rel.relationship_type] || 'var(--muted-foreground)',
    });
  });
  return nodes;
}

export default function TrustGraphPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [relationships, setRelationships] = useState<TrustRelationship[]>([]);
  const [clusters, setClusters] = useState<TrustCluster[]>([]);
  const [myScore, setMyScore] = useState(50);
  const [activeTab, setActiveTab] = useState<'graph' | 'connections' | 'clusters'>('graph');
  const [searchQuery, setSearchQuery] = useState('');
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);

  useEffect(() => {
    setGraphNodes(generateGraphNodes(relationships, myScore));
  }, [relationships, myScore]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const { data: relData } = await supabase
          .from('trust_relationships')
          .select('*, connected_user:to_user_id(full_name, username)')
          .eq('from_user_id', user.id)
          .order('trust_score', { ascending: false })
          .limit(20);
        setRelationships((relData as any) ?? []);

        const { data: clusterData } = await supabase
          .from('trust_clusters')
          .select('*')
          .order('avg_trust_score', { ascending: false });
        setClusters(clusterData ?? []);

        const { data: scoreData } = await supabase
          .from('accountability_scores')
          .select('accountability_score')
          .eq('user_id', user.id)
          .single();
        if (scoreData) setMyScore(Number(scoreData.accountability_score));
      } catch {}
    };
    fetchData();
  }, [user]);

  const filteredRels = relationships.filter(r =>
    r.connected_user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.connected_user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const avgTrust = relationships.length > 0
    ? (relationships.reduce((s, r) => s + r.trust_score, 0) / relationships.length).toFixed(1)
    : '0.0';

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-full pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <Link href="/profile-screen" className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface)' }}>
            <ArrowLeft size={18} style={{ color: 'var(--muted-foreground)' }} />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Trust Graph</h1>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Your trust network explorer</p>
          </div>
        </div>

        <div className="px-4 pt-4 space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Connections', value: relationships.length, color: 'var(--primary)' },
              { label: 'Avg Trust', value: avgTrust, color: 'var(--success)' },
              { label: 'Clusters', value: clusters.length, color: 'var(--warning)' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface)' }}>
            {(['graph', 'connections', 'clusters'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all" style={{ background: activeTab === tab ? 'var(--primary)' : 'transparent', color: activeTab === tab ? '#fff' : 'var(--muted-foreground)' }}>
                {tab}
              </button>
            ))}
          </div>

          {/* Graph Tab - SVG visualization */}
          {activeTab === 'graph' && (
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <svg width="100%" viewBox="0 0 320 280" style={{ display: 'block' }}>
                  {/* Background */}
                  <rect width="320" height="280" fill="var(--surface)" />
                  {/* Grid dots */}
                  {Array.from({ length: 8 }).map((_, row) =>
                    Array.from({ length: 10 }).map((_, col) => (
                      <circle key={`${row}-${col}`} cx={col * 36 + 18} cy={row * 36 + 18} r={1} fill="var(--border)" opacity={0.4} />
                    ))
                  )}
                  {/* Edges */}
                  {graphNodes.slice(1).map((node) => (
                    <line
                      key={`edge-${node.id}`}
                      x1={graphNodes[0].x} y1={graphNodes[0].y}
                      x2={node.x} y2={node.y}
                      stroke={node.color}
                      strokeWidth={node.trustScore > 70 ? 2 : 1}
                      strokeOpacity={0.4}
                      strokeDasharray={node.color === REL_COLORS.flagged ? '4,4' : undefined}
                    />
                  ))}
                  {/* Nodes */}
                  {graphNodes.map((node) => (
                    <g key={node.id}>
                      <circle cx={node.x} cy={node.y} r={node.size + 4} fill={node.color} opacity={0.1} />
                      <circle cx={node.x} cy={node.y} r={node.size} fill={node.color} opacity={0.85} />
                      <text x={node.x} y={node.y + node.size + 12} textAnchor="middle" fill="var(--foreground)" fontSize={9} fontWeight="600">
                        {node.name}
                      </text>
                      {node.id === 'me' && (
                        <text x={node.x} y={node.y + 4} textAnchor="middle" fill="#fff" fontSize={8} fontWeight="bold">YOU</text>
                      )}
                    </g>
                  ))}
                </svg>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3">
                {Object.entries(REL_COLORS).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                    <span className="text-xs capitalize" style={{ color: 'var(--muted-foreground)' }}>{type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connections Tab */}
          {activeTab === 'connections' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <Search size={14} style={{ color: 'var(--muted-foreground)' }} />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search connections..."
                  className="flex-1 text-sm outline-none bg-transparent"
                  style={{ color: 'var(--foreground)' }}
                />
              </div>
              {filteredRels.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-sm font-semibold text-foreground">No connections yet</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    Play in pools together to start building your trust network.
                  </p>
                </div>
              )}
              {filteredRels.map(rel => {
                const relColor = REL_COLORS[rel.relationship_type] || 'var(--muted-foreground)';
                const scoreColor = rel.trust_score >= 70 ? 'var(--success)' : rel.trust_score >= 40 ? 'var(--warning)' : 'var(--accent)';
                return (
                  <div key={rel.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: `${relColor}18`, color: relColor }}>
                      {rel.connected_user.full_name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{rel.connected_user.full_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-2xs px-1.5 py-0.5 rounded-full capitalize" style={{ background: `${relColor}18`, color: relColor }}>{rel.relationship_type}</span>
                        <span className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>{rel.interaction_count} interactions</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: scoreColor }}>{rel.trust_score.toFixed(0)}</p>
                      <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>trust</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Clusters Tab */}
          {activeTab === 'clusters' && (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Trust clusters are groups of highly connected users</p>
              {clusters.map(cluster => (
                <div key={cluster.id} className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-foreground">{cluster.cluster_name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{cluster.member_count} members</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: 'var(--primary)' }}>{cluster.avg_trust_score.toFixed(0)}</p>
                      <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>avg trust</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Avg Trust Score</span>
                        <span className="text-2xs font-semibold" style={{ color: 'var(--success)' }}>{cluster.avg_trust_score.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--elevated)' }}>
                        <div className="h-full rounded-full" style={{ width: `${cluster.avg_trust_score}%`, background: 'var(--success)' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Cohesion</span>
                        <span className="text-2xs font-semibold" style={{ color: 'var(--primary)' }}>{(cluster.cohesion_score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--elevated)' }}>
                        <div className="h-full rounded-full" style={{ width: `${cluster.cohesion_score * 100}%`, background: 'var(--primary)' }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
