import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaTwitter, FaInstagram, FaPills, FaClinicMedical, FaChartLine } from 'react-icons/fa';

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap justify-between items-center">
            <Link to="/" className="flex items-center space-x-2">
              <FaPills className="text-white text-3xl animate-pulse" />
              <h1 className="text-white text-2xl font-bold font-mono hover:text-purple-200 transition-colors">
                MedInventory Pro
              </h1>
            </Link>
            
            <div className="flex space-x-4 mt-2 sm:mt-0">
              <Link to="/login">
                <button className="bg-white/10 backdrop-blur-sm text-white px-6 py-2 rounded-full 
                  hover:bg-white/20 hover:scale-105 transition-all shadow-md hover:shadow-lg
                  font-semibold flex items-center space-x-2">
                  <span>Login</span>
                </button>
              </Link>
              <Link to="/register">
                <button className="bg-pink-500 text-white px-6 py-2 rounded-full 
                  hover:bg-pink-600 hover:scale-105 transition-all shadow-md hover:shadow-lg
                  font-semibold flex items-center space-x-2">
                  <span>Get Started</span>
                  <span className="text-lg">🚀</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-grow container mx-auto text-center py-16 px-4">
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Revolutionizing Pharmacy Management
          </h2>
          <p className="text-xl text-gray-700 mb-8 leading-relaxed">
            Transform your pharmacy operations with our AI-powered inventory solution. 
            <span className="block mt-2 text-purple-600 font-semibold">
              Real-time tracking • Automated alerts • Smart analytics
            </span>
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
          {[
            {
              icon: FaClinicMedical,
              title: "Smart Inventory",
              description: "AI-powered stock predictions and expiration tracking",
              color: "from-purple-500 to-blue-500"
            },
            {
              icon: FaPills,
              title: "Medicine Tracking",
              description: "Batch-level tracking with real-time updates",
              color: "from-pink-500 to-orange-500"
            },
            {
              icon: FaChartLine,
              title: "Advanced Analytics",
              description: "Interactive dashboards & sales insights",
              color: "from-teal-400 to-blue-400"
            }
          ].map((card, index) => (
            <div 
              key={index}
              className="group bg-white rounded-xl shadow-xl p-6 hover:shadow-2xl transition-all 
                        duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-purple-200"
            >
              <div className={`bg-gradient-to-br ${card.color} w-16 h-16 rounded-xl mb-4 
                             mx-auto flex items-center justify-center text-white text-3xl 
                             group-hover:rotate-12 transition-transform`}>
                <card.icon />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-gray-800">{card.title}</h3>
              <p className="text-gray-600">{card.description}</p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { number: "500+", label: "Pharmacies Trust Us" },
            { number: "1M+", label: "Medicines Tracked" },
            { number: "24/7", label: "Support" },
            { number: "99.9%", label: "Accuracy" }
          ].map((stat, index) => (
            <div 
              key={index}
              className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-purple-100 
                        hover:bg-white hover:shadow-lg transition-all"
            >
              <div className="text-3xl font-bold text-purple-600 mb-1">{stat.number}</div>
              <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-purple-900 to-blue-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold mb-2">MedInventory Pro</h3>
              <p className="text-gray-300">© 2023 All rights reserved</p>
            </div>
            
            <div className="flex space-x-6">
              {[
                { href: "#", icon: FaFacebookF, color: "hover:text-blue-400" },
                { href: "#", icon: FaTwitter, color: "hover:text-cyan-400" },
                { href: "#", icon: FaInstagram, color: "hover:text-pink-400" }
              ].map((social, idx) => (
                <a 
                  key={idx}
                  href={social.href}
                  className={`text-2xl transition-transform hover:scale-125 ${social.color}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <social.icon />
                </a>
              ))}
            </div>
          </div>
          
          <div className="mt-8 text-center text-gray-300 text-sm">
            <p>Healthcare powered by technology 💊</p>
            <p className="mt-2">Need help? <a href="mailto:support@medinventory.com" className="underline hover:text-white">Contact us</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;