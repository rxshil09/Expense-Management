import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Expense Management System
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Streamline your business expense reporting and approval process.
            Track, submit, and approve expenses with ease.
          </p>
          <div className="space-x-4">
            <Link
              href="/(auth)/login"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/(auth)/register"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold border border-blue-600 hover:bg-blue-50 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
        
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Easy Submission</h3>
            <p className="text-gray-600">
              Submit expenses quickly with receipt upload and automatic data extraction.
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Smart Approvals</h3>
            <p className="text-gray-600">
              Automated approval workflows based on customizable business rules.
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Real-time Tracking</h3>
            <p className="text-gray-600">
              Track expense status and get insights with comprehensive reporting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}