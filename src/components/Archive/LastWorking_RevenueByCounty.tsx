import React from 'react';

// Currency formatting utility
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

interface CountyRevenue {
  county: string;
  revenue: number;
  percentage: number;
}

interface RevenueByCountyProps {
  isLoading: boolean;
  countyRevenue: CountyRevenue[];
}

export function RevenueByCounty({ isLoading, countyRevenue }: RevenueByCountyProps) {
  // Color palette for counties
  const colors = [
    'bg-purple-600',
    'bg-purple-500', 
    'bg-purple-400',
    'bg-purple-300',
    'bg-gray-400'
  ];

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-2xl transition-shadow overflow-hidden">
      <div className="bg-purple-700 text-white px-6 py-4">
        <h3 className="text-lg font-semibold flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10" />
          </svg>
          Revenue by County
        </h3>
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">Based on invoice data</p>
          <div className="text-right">
            <p className="text-sm text-gray-500">This Year</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="h-3 bg-gray-300 rounded-full animate-pulse" style={{ width: `${30 + item * 20}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : countyRevenue.length > 0 ? (
          <div className="space-y-4">
            {countyRevenue.map((county, index) => (
              <div key={county.county} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${colors[index] || 'bg-gray-400'}`}></div>
                    <span className="font-medium text-gray-800">{county.county}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{formatCurrency(county.revenue)}</span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ease-out ${colors[index] || 'bg-gray-400'}`}
                    style={{ width: `${county.percentage}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{county.percentage.toFixed(1)}% of total revenue</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10" />
            </svg>
            <p className="text-gray-500">No revenue data available</p>
            <p className="text-sm text-gray-400 mt-1">Create some invoices to see county breakdown</p>
          </div>
        )}
      </div>
    </div>
  );
} 