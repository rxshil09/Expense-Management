import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Lock, Zap } from 'lucide-react';
import Button from '../components/ui/Button';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 lg:py-6">
            <div className="flex items-center">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-2" />
              <span className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">AuthBoilerplate</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link to="/signin">
                <Button variant="outline" className="text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center max-w-5xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
              Authentication Made{' '}
              <span className="text-blue-600">Simple</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto px-4 sm:px-0">
              A complete authentication boilerplate with React, Node.js, and MongoDB. 
              Features JWT authentication, protected routes, and user management out of the box.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center max-w-md sm:max-w-none mx-auto">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-sm sm:text-base">
                  Start Building
                </Button>
              </Link>
              <Link to="/signin" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-sm sm:text-base">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-gray-50 py-12 sm:py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16 max-w-4xl mx-auto">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                Everything You Need
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                Built with modern technologies and best practices
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-6xl mx-auto">
              <div className="text-center p-4 sm:p-6">
                <div className="bg-blue-100 rounded-full p-3 sm:p-4 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  Secure Authentication
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  JWT-based authentication with bcrypt password hashing
                </p>
              </div>
              
              <div className="text-center p-4 sm:p-6">
                <div className="bg-green-100 rounded-full p-3 sm:p-4 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  User Management
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Complete user registration, login, and profile management
                </p>
              </div>
              
              <div className="text-center p-4 sm:p-6">
                <div className="bg-purple-100 rounded-full p-3 sm:p-4 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                  <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  Protected Routes
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Route-level protection with role-based access control
                </p>
              </div>
              
              <div className="text-center p-4 sm:p-6">
                <div className="bg-orange-100 rounded-full p-3 sm:p-4 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                  <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  Ready to Deploy
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Production-ready with environment configuration
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 mr-2" />
            <span className="text-base sm:text-lg font-semibold">AuthBoilerplate</span>
          </div>
          <p className="text-sm sm:text-base text-gray-400">
            © 2025 AuthBoilerplate. Built with ❤️ for developers.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
