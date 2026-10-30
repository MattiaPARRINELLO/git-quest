import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { DiagramId } from '../../../content/types';

const SVG_WIDTH = 680;
const SVG_HEIGHT = 260;

function Frame({ children }: { readonly children: ReactNode }) {
  return (
    <svg
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      className="h-auto w-full"
      role="img"
      aria-label="Schéma pédagogique"
    >
      {children}
    </svg>
  );
}

function Label({
  x,
  y,
  children,
  color = 'var(--muted)',
  size = 12,
  anchor = 'middle',
}: {
  readonly x: number;
  readonly y: number;
  readonly children: ReactNode;
  readonly color?: string;
  readonly size?: number;
  readonly anchor?: 'start' | 'middle' | 'end';
}) {
  return (
    <text
      x={x}
      y={y}
      fill={color}
      fontSize={size}
      textAnchor={anchor}
      fontFamily="var(--font-mono)"
    >
      {children}
    </text>
  );
}

function Node({ x, y, color, label }: { x: number; y: number; color: string; label?: string }) {
  return (
    <g>
      <motion.circle
        cx={x}
        cy={y}
        r={9}
        fill="var(--panel)"
        stroke={color}
        strokeWidth={2.4}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35 }}
      />
      {label && <Label x={x} y={y + 26} size={10}>{label}</Label>}
    </g>
  );
}

function Arrow({ x1, x2, y, color = 'var(--border-strong)' }: { x1: number; x2: number; y: number; color?: string }) {
  return (
    <g>
      <line x1={x1} y1={y} x2={x2 - 8} y2={y} stroke={color} strokeWidth={1.6} />
      <path d={`M ${x2 - 12} ${y - 4} L ${x2} ${y} L ${x2 - 12} ${y + 4}`} fill="none" stroke={color} strokeWidth={1.6} />
    </g>
  );
}

function SnapshotDiagram() {
  const boxes = [
    { x: 30, title: 'Working dir', files: ['README.md', 'app.ts'] },
    { x: 250, title: 'Index', files: ['README.md', 'app.ts'] },
    { x: 470, title: 'Commit', files: ['README.md'] },
  ];

  return (
    <Frame>
      {boxes.map((box, index) => (
        <g key={box.title}>
          <rect
            x={box.x}
            y={54}
            width={170}
            height={140}
            rx={14}
            fill="var(--panel-2)"
            stroke="var(--border)"
          />
          <Label x={box.x + 85} y={80} color="var(--text)" size={13}>
            {box.title}
          </Label>
          {box.files.map((file, fileIndex) => (
            <g key={file}>
              <rect x={box.x + 16} y={96 + fileIndex * 28} width={138} height={20} rx={5} fill="var(--panel)" stroke="var(--border)" />
              <Label x={box.x + 26} y={110 + fileIndex * 28} anchor="start" size={10} color={file === 'README.md' ? 'var(--success)' : 'var(--muted)'}>
                {file}
              </Label>
            </g>
          ))}
          {index < boxes.length - 1 && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + index * 0.2 }}>
              <Arrow x1={box.x + 176} x2={box.x + 214} y={124} color="var(--accent)" />
            </motion.g>
          )}
        </g>
      ))}
      <Label x={555} y={220} color="var(--accent)" size={11}>
        snapshot complet
      </Label>
    </Frame>
  );
}

function BranchPointerDiagram() {
  return (
    <Frame>
      <line x1={80} y1={120} x2={520} y2={120} stroke="var(--border-strong)" strokeWidth={2} />
      <Node x={110} y={120} color="var(--success)" label="a1b2c3d" />
      <Node x={260} y={120} color="var(--accent-2)" label="b2c3d4e" />
      <Node x={420} y={120} color="var(--accent)" label="c3d4e5f" />

      <motion.g initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.35 }}>
        <rect x={168} y={62} width={104} height={26} rx={13} fill="var(--accent)" fillOpacity={0.16} stroke="var(--accent)" strokeOpacity={0.6} />
        <Label x={220} y={79} color="var(--accent)" size={12}>feature</Label>
      </motion.g>
      <line x1={220} y1={88} x2={260} y2={110} stroke="var(--accent)" strokeOpacity={0.6} />

      <motion.g initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.35, delay: 0.15 }}>
        <rect x={368} y={62} width={88} height={26} rx={13} fill="var(--success)" fillOpacity={0.16} stroke="var(--success)" strokeOpacity={0.6} />
        <Label x={412} y={79} color="var(--success)" size={12}>main</Label>
      </motion.g>
      <line x1={412} y1={88} x2={420} y2={110} stroke="var(--success)" strokeOpacity={0.6} />

      <Label x={270} y={192} size={11}>HEAD suit une étiquette, pas une copie de fichiers</Label>
      <rect x={266} y={202} width={220} height={24} rx={6} fill="var(--panel-2)" stroke="var(--border)" />
      <Label x={376} y={218} color="var(--accent-2)" size={10}>git switch feature</Label>
    </Frame>
  );
}

function HeadStatesDiagram() {
  return (
    <Frame>
      <g>
        <rect x={30} y={40} width={290} height={180} rx={14} fill="var(--panel-2)" stroke="var(--border)" />
        <Label x={175} y={68} color="var(--text)" size={13}>HEAD attaché</Label>
        <line x1={80} y1={130} x2={260} y2={130} stroke="var(--border-strong)" strokeWidth={2} />
        <Node x={100} y={130} color="var(--success)" />
        <Node x={200} y={130} color="var(--success)" />
        <rect x={168} y={96} width={72} height={24} rx={12} fill="var(--success)" fillOpacity={0.16} stroke="var(--success)" strokeOpacity={0.6} />
        <Label x={204} y={112} color="var(--success)" size={11}>main</Label>
        <Label x={100} y={172} color="var(--accent)" size={11}>HEAD → main</Label>
      </g>

      <g>
        <rect x={360} y={40} width={290} height={180} rx={14} fill="var(--panel-2)" stroke="var(--border)" />
        <Label x={505} y={68} color="var(--text)" size={13}>HEAD détaché</Label>
        <line x1={410} y1={130} x2={590} y2={130} stroke="var(--border-strong)" strokeWidth={2} />
        <Node x={430} y={130} color="var(--muted)" />
        <Node x={530} y={130} color="var(--warning)" />
        <rect x={492} y={96} width={76} height={24} rx={12} fill="var(--warning)" fillOpacity={0.12} stroke="var(--warning)" strokeOpacity={0.5} strokeDasharray="4 3" />
        <Label x={530} y={112} color="var(--warning)" size={10}>détaché</Label>
        <Label x={530} y={172} color="var(--warning)" size={11}>HEAD → c3d4e5f</Label>
      </g>
    </Frame>
  );
}

function MergeModesDiagram() {
  return (
    <Frame>
      <g>
        <rect x={20} y={36} width={300} height={190} rx={14} fill="var(--panel-2)" stroke="var(--border)" />
        <Label x={170} y={62} color="var(--text)" size={13}>Fast-forward</Label>
        <line x1={58} y1={130} x2={250} y2={130} stroke="var(--border-strong)" strokeWidth={2} />
        <Node x={70} y={130} color="var(--success)" label="initial" />
        <Node x={160} y={130} color="var(--accent)" label="feature" />
        <Node x={240} y={130} color="var(--success)" label="main →" />
        <path d="M 178 118 C 195 90 220 90 238 112" fill="none" stroke="var(--success)" strokeWidth={1.6} strokeDasharray="4 3" />
        <Label x={170} y={196} size={10}>aucun nouveau commit</Label>
      </g>

      <g>
        <rect x={350} y={36} width={310} height={190} rx={14} fill="var(--panel-2)" stroke="var(--border)" />
        <Label x={505} y={62} color="var(--text)" size={13}>Merge commit</Label>
        <line x1={390} y1={100} x2={540} y2={100} stroke="var(--success)" strokeWidth={2} />
        <line x1={390} y1={160} x2={540} y2={160} stroke="var(--accent)" strokeWidth={2} />
        <Node x={390} y={100} color="var(--success)" />
        <Node x={390} y={160} color="var(--accent)" />
        <Node x={470} y={100} color="var(--success)" />
        <Node x={470} y={160} color="var(--accent)" />
        <Node x={570} y={130} color="var(--accent-2)" />
        <path d="M 480 100 C 530 100 540 130 558 130" fill="none" stroke="var(--success)" strokeWidth={1.6} />
        <path d="M 480 160 C 530 160 540 130 558 130" fill="none" stroke="var(--accent)" strokeWidth={1.6} strokeDasharray="4 3" />
        <Label x={570} y={170} color="var(--accent-2)" size={10}>2 parents</Label>
      </g>
    </Frame>
  );
}

function WorktreesDiagram() {
  return (
    <Frame>
      <rect x={230} y={30} width={220} height={70} rx={14} fill="var(--panel-2)" stroke="var(--border)" />
      <Label x={340} y={58} color="var(--text)" size={13}>dépôt partagé</Label>
      <Label x={340} y={78} size={10}>commits · branches</Label>

      <path d="M 300 100 L 140 150" stroke="var(--accent)" strokeWidth={1.6} />
      <path d="M 380 100 L 520 150" stroke="var(--accent-2)" strokeWidth={1.6} />

      <g>
        <rect x={30} y={150} width={220} height={90} rx={12} fill="var(--panel-2)" stroke="var(--accent)" strokeOpacity={0.5} />
        <Label x={140} y={176} color="var(--accent)" size={12}>worktree principal</Label>
        <Label x={140} y={198} size={10}>HEAD → main</Label>
        <Label x={140} y={218} size={10}>index + working dir</Label>
      </g>
      <g>
        <rect x={430} y={150} width={220} height={90} rx={12} fill="var(--panel-2)" stroke="var(--accent-2)" strokeOpacity={0.5} />
        <Label x={540} y={176} color="var(--accent-2)" size={12}>worktree hotfix</Label>
        <Label x={540} y={198} size={10}>HEAD → hotfix</Label>
        <Label x={540} y={218} size={10}>index + working dir</Label>
      </g>
    </Frame>
  );
}

const DIAGRAMS: Record<DiagramId, () => ReactNode> = {
  'commit-snapshot': SnapshotDiagram,
  'branch-pointer': BranchPointerDiagram,
  'head-states': HeadStatesDiagram,
  'merge-modes': MergeModesDiagram,
  worktrees: WorktreesDiagram,
};

export function Diagram({ id }: { readonly id: DiagramId }) {
  const Component = DIAGRAMS[id];
  return <Component />;
}
