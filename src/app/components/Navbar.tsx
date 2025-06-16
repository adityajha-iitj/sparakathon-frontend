"use client";
import { useState } from 'react';
import { ChevronDown, Search, Heart, User, ShoppingCart } from 'lucide-react';

export default function Navbar() {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <nav className="bg-[#0053E2] text-white font-[family-name:var(--font-inter)]">
      <div className="px-4 py-3">
        <div className="max-w-none mx-auto flex items-center justify-between">
          
          {/* Left section - Walmart logo */}
          <div className="flex items-center space-x-4">
            {/* Walmart Spark Icon - You'll need to replace this with actual icon */}
            <div className="w-8 h-8 flex items-center justify-center">
              {/* Placeholder for Walmart spark icon */}
                <div className="text-[#ffc220] font-bold items-center justify-center">
                <img src="./pngegg.png" alt="Star Icon" className="w-full h-full inline" />
                </div>
              {/* Replace above div with: <WalmartSparkIcon className="w-8 h-8" /> */}
            </div>

            {/* Pickup or delivery section */}
            <div className="flex items-center bg-[#002e99] hover:bg-[#003d7a] rounded-full px-4 py-2 cursor-pointer transition-colors">
              <div className="w-5 h-5 mr-3 flex items-center justify-center">
                {/* Location pin icon - You'll need to replace this */}
                <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-[#002e99] rounded-full"></div>
                </div>
                {/* Replace above with: <LocationPinIcon className="w-5 h-5 text-white" /> */}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Pickup or delivery?</span>
                <span className="text-xs text-gray-200">Sacramento, 95829 • Sacramento Supe...</span>
              </div>
              <ChevronDown className="w-4 h-4 ml-3 text-white" />
            </div>
          </div>

          {/* Center section - Search bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search everything at Walmart online and in store"
                className={`w-full py-3 px-4 pr-14 text-[#002e99] text-base border-2 border-transparent bg-white focus:outline-none transition-all duration-200 ${
                  isSearchFocused 
                    ? 'rounded-none border-[#ffc220]' 
                    : 'rounded-full hover:border-gray-300'
                }`}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#002e99] hover:bg-[#002e99] text-[#ffff] p-2 rounded-full transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Right section - Account, Reorder, Cart */}
          <div className="flex items-center space-x-6">
            
            {/* Reorder My Items */}
            <button className="flex flex-col items-center text-xs hover:text-[#ffc220] transition-colors group">
              {/* Heart/Reorder icon - You might want to replace this */}
              <Heart className="w-6 h-6 mb-1 group-hover:text-[#ffc220]" />
              {/* Replace with: <ReorderIcon className="w-6 h-6 mb-1" /> */}
              <div className="text-center leading-tight">
                <div>Reorder</div>
                <div className='font-bold'>My Items</div>
              </div>
            </button>

            {/* Sign In Account */}
            <button className="flex flex-col items-center text-xs hover:text-[#ffc220] transition-colors group">
              <User className="w-6 h-6 mb-1 group-hover:text-[#ffc220]" />
              <div className="text-center leading-tight">
                <div>Sign In</div>
                <div className='font-bold'>Account</div>
              </div>
            </button>

            {/* Shopping Cart */}
            <button className="flex items-center hover:text-[#ffc220] transition-colors group relative">
              <div className="relative">
                <ShoppingCart className="w-7 h-7 group-hover:text-[#ffc220]" />
                {/* Cart count badge */}
                <span className="absolute -top-2 -right-2 bg-[#ffc220] text-[#0071ce] text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  0
                </span>
              </div>
              <div className="ml-2 text-xs">
                <div className="font-medium">$0.00</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}