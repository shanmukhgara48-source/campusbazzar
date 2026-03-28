interface Props {
  label: string;
  value: string | number;
  icon: string;
  sub?: string;
  color?: 'purple' | 'blue' | 'green' | 'orange';
}

const colorMap = {
  purple: 'bg-violet-50 text-violet-600',
  blue:   'bg-blue-50 text-blue-600',
  green:  'bg-green-50 text-green-600',
  orange: 'bg-orange-50 text-orange-600',
};

export default function StatCard({ label, value, icon, sub, color = 'purple' }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
