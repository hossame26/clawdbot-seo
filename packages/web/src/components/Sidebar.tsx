'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: 'Documentation', href: 'https://github.com/hossamelaib/clawdbot-seo', icon: '📖' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <span className="text-xl font-bold text-gray-900">ClawdBot</span>
          <span className="text-sm text-primary-600 font-medium">SEO</span>
        </Link>
      </div>

      <nav className="px-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-gray-200">
        <div className="bg-gradient-to-r from-primary-500 to-purple-500 text-white p-4 rounded-lg">
          <p className="font-medium text-sm">Pro Tip</p>
          <p className="text-xs opacity-90 mt-1">
            Run regular audits to track your SEO progress over time.
          </p>
        </div>
      </div>
    </aside>
  );
}
