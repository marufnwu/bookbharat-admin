import React from 'react';

const TestTailwind: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Tailwind CSS Test</h1>
        <p className="text-gray-600 mb-6">If you can see styled content with gradients, shadows, and proper spacing, Tailwind CSS is working!</p>

        <div className="space-y-4">
          <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
            Primary Button
          </button>

          <button className="w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
            Secondary Button
          </button>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-red-500 h-20 rounded-lg"></div>
          <div className="bg-green-500 h-20 rounded-lg"></div>
          <div className="bg-blue-500 h-20 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export default TestTailwind;