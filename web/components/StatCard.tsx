import clsx from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  positive?: boolean;
  icon: string;
  color?: 'green' | 'blue' | 'yellow' | 'red';
}

const colorMap = {
  green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-700',  text: 'text-green-600' },
  blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-700',    text: 'text-blue-600' },
  yellow: { bg: 'bg-yellow-50', icon: 'bg-yellow-100 text-yellow-700', text: 'text-yellow-600' },
  red:    { bg: 'bg-red-50',    icon: 'bg-red-100 text-red-700',      text: 'text-red-600' },
};

export default function StatCard({
  title,
  value,
  change,
  positive,
  icon,
  color = 'green',
}: StatCardProps) {
  const c = colorMap[color];

  return (
    <div className={clsx('rounded-xl p-5 border border-gray-100 bg-white shadow-sm', c.bg)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={clsx('text-xs font-medium mt-1.5', positive ? 'text-green-600' : 'text-red-500')}>
              {positive ? '↑' : '↓'} {change}
            </p>
          )}
        </div>
        <span className={clsx('text-2xl w-12 h-12 flex items-center justify-center rounded-xl', c.icon)}>
          {icon}
        </span>
      </div>
    </div>
  );
}
