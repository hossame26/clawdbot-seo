'use client';

interface ScoreCircleProps {
  score: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

function getScoreClass(score: number): string {
  if (score >= 90) return 'score-good';
  if (score >= 70) return 'score-moderate';
  if (score >= 50) return 'score-poor';
  return 'score-bad';
}

const sizeClasses = {
  sm: 'w-16 h-16 text-lg',
  md: 'w-24 h-24 text-2xl',
  lg: 'w-32 h-32 text-3xl',
};

export default function ScoreCircle({ score, label, size = 'md' }: ScoreCircleProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`score-circle ${getScoreClass(score)} ${sizeClasses[size]}`}>
        {score}
      </div>
      <span className="text-sm font-medium text-gray-600">{label}</span>
    </div>
  );
}
