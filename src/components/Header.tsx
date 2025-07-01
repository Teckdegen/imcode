
import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu, X, Code, Zap } from 'lucide-react';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-electric-blue-500/20 bg-cyber-black-100/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Code className="h-8 w-8 text-electric-blue-500 animate-pulse" />
                <div className="absolute inset-0 h-8 w-8 text-electric-blue-500 animate-ping opacity-20">
                  <Code className="h-8 w-8" />
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold bg-gradient-to-r from-electric-blue-400 to-electric-blue-600 bg-clip-text text-transparent">
                  ImCode
                </h1>
                <span className="text-xs text-electric-blue-300 -mt-1">Blue & Black</span>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className="bg-electric-blue-500/10 text-electric-blue-300 border-electric-blue-500/30 animate-pulse-slow"
            >
              <Zap className="w-3 h-3 mr-1" />
              We are in Beta
            </Badge>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Button variant="ghost" className="text-electric-blue-300 hover:text-electric-blue-100 hover:bg-electric-blue-500/10">
              Projects
            </Button>
            <Button variant="ghost" className="text-electric-blue-300 hover:text-electric-blue-100 hover:bg-electric-blue-500/10">
              Templates
            </Button>
            <Button variant="ghost" className="text-electric-blue-300 hover:text-electric-blue-100 hover:bg-electric-blue-500/10">
              Docs
            </Button>
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block">
              <ConnectButton />
            </div>
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-electric-blue-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-electric-blue-500/20 bg-cyber-black-100/95 backdrop-blur-xl">
            <div className="px-4 py-6 space-y-4">
              <div className="sm:hidden mb-4">
                <ConnectButton />
              </div>
              <Button variant="ghost" className="w-full justify-start text-electric-blue-300 hover:text-electric-blue-100 hover:bg-electric-blue-500/10">
                Projects
              </Button>
              <Button variant="ghost" className="w-full justify-start text-electric-blue-300 hover:text-electric-blue-100 hover:bg-electric-blue-500/10">
                Templates
              </Button>
              <Button variant="ghost" className="w-full justify-start text-electric-blue-300 hover:text-electric-blue-100 hover:bg-electric-blue-500/10">
                Docs
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
