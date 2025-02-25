'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Image as ImageIcon, Database } from 'lucide-react';
import Image from 'next/image';

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path) => 
    pathname === path 
      ? 'bg-indigo-600 text-white' 
      : 'text-gray-300 hover:bg-indigo-600 hover:text-white';

  return (
    <nav className="bg-indigo-900 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-6 flex items-center justify-between h-14">
        {/* Logo & Branding */}
        <div className="flex items-center gap-4">
          <div className="bg-white p-1 rounded-lg shadow-md">
            <Image
              src="https://www.ahana.co.in/wp-content/uploads/2024/03/New1-Ahana-2024-website-Logo-Medium.svg"
              alt="Ahana Logo"
              width={120}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </div>
          <span className="text-white text-lg font-bold tracking-wide">
            AI Image Tool
          </span>
        </div>
        
        {/* Navigation Links */}
        <div className="flex space-x-4">
          <Link
            href="/imagedest"
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 ${isActive('/imagedest')}`}
          >
            <ImageIcon className="h-5 w-5" />
            <span>Image Analysis</span>
          </Link>
          <Link
            href="/bulkimgpro"
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 ${isActive('/bulkimgpro')}`}
          >
            <Database className="h-5 w-5" />
            <span>Bulk Processing</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
