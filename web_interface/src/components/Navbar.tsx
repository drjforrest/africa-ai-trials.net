'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', name: 'Network' },
    { href: '/data', name: 'Data' },
    { href: '/figures', name: 'Figures' },
    { href: '/about', name: 'About' },
  ];

  return (
    <nav className="bg-gradient-to-r from-blue-900 to-indigo-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Image 
                src="/images/app-icon.png" 
                alt="Network Logo" 
                width={32} 
                height={32} 
                className="mr-3"
              />
              <div>
                <h1 className="text-xl font-bold text-white">Network</h1>
                <p className="text-xs text-blue-200 -mt-1">AI Trials in Africa</p>
              </div>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'border-blue-300 text-white'
                      : 'border-transparent text-blue-200 hover:border-blue-400 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <div className="text-right">
              <div className="text-xs text-blue-200">Live Network Analysis</div>
              <div className="text-xs text-blue-300 flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                Active
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
