'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Image as ImageIcon, Database } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path) => {
    return pathname === path ? 'bg-indigo-700 text-white' : 'text-gray-300 hover:bg-indigo-700 hover:text-white';
  };

  return (
    <nav className="bg-indigo-800 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <span className="text-white text-lg font-semibold">AI Image Tool</span>
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                href="/imagedest"
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${isActive('/imagedest')}`}
              >
                <ImageIcon className="h-4 w-4" />
                <span>Image Analysis</span>
              </Link>
              <Link
                href="/bulkimgpro"
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${isActive('/bulkimgpro')}`}
              >
                <Database className="h-4 w-4" />
                <span>Bulk Processing</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
