import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, AreaChart, Area } from 'recharts';
import api from '../services/api';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Dashboard() {
  const [recipes, setRecipes] = useState([]);
  const [stats, setStats] = useState({ totalRecipes: 0, totalRecords: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/recipes');
      const recipesData = response.data;
      setRecipes(recipesData);
      
      // Calculate stats
      let totalRecords = 0;
      let totalElements = 0;
      recipesData.forEach(r => {
        totalElements += r.elements?.length || 0;
      });
      
      // Fetch records count for each recipe
      for (const recipe of recipesData) {
        try {
          const recordsRes = await api.get(`/recipes/${recipe.id}/records`);
          recipe.recordCount = recordsRes.data.length;
          totalRecords += recipe.recordCount;
        } catch (e) {
          recipe.recordCount = 0;
        }
      }
      
      setStats({
        totalRecipes: recipesData.length,
        totalRecords,
        totalElements
      });
      setRecipes([...recipesData]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart data
  const recipeChartData = recipes.map(r => ({
    name: r.name.length > 15 ? r.name.substring(0, 15) + '...' : r.name,
    elements: r.elements?.length || 0,
    records: r.recordCount || 0
  }));

  const pieData = recipes.map(r => ({
    name: r.name,
    value: r.elements?.length || 0
  }));

  // Simulated production data for line chart
  const productionData = [
    { time: '08:00', efficiency: 85, output: 120, quality: 98 },
    { time: '09:00', efficiency: 88, output: 135, quality: 97 },
    { time: '10:00', efficiency: 92, output: 150, quality: 99 },
    { time: '11:00', efficiency: 90, output: 145, quality: 98 },
    { time: '12:00', efficiency: 75, output: 100, quality: 96 },
    { time: '13:00', efficiency: 82, output: 125, quality: 97 },
    { time: '14:00', efficiency: 95, output: 160, quality: 99 },
    { time: '15:00', efficiency: 93, output: 155, quality: 98 },
    { time: '16:00', efficiency: 89, output: 140, quality: 97 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <Link
          to="/recipes"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <span>➕</span> New Recipe
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Recipes</p>
              <p className="text-3xl font-bold">{stats.totalRecipes}</p>
            </div>
            <div className="text-4xl opacity-80">📋</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Data Records</p>
              <p className="text-3xl font-bold">{stats.totalRecords}</p>
            </div>
            <div className="text-4xl opacity-80">📊</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Elements</p>
              <p className="text-3xl font-bold">{stats.totalElements}</p>
            </div>
            <div className="text-4xl opacity-80">⚙️</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Avg Efficiency</p>
              <p className="text-3xl font-bold">92%</p>
            </div>
            <div className="text-4xl opacity-80">📈</div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Efficiency Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Production Efficiency</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={productionData}>
              <defs>
                <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorQuality" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: 'white' }}
              />
              <Area type="monotone" dataKey="efficiency" stroke="#3B82F6" fillOpacity={1} fill="url(#colorEfficiency)" name="Efficiency %" />
              <Area type="monotone" dataKey="quality" stroke="#10B981" fillOpacity={1} fill="url(#colorQuality)" name="Quality %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recipe Elements Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recipe Elements Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: 'white' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No recipes yet
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recipe Overview Bar Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recipe Overview</h3>
          {recipeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={recipeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" tick={{ fontSize: 12 }} />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: 'white' }}
                />
                <Legend />
                <Bar dataKey="elements" name="Elements" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="records" name="Records" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No recipes yet
            </div>
          )}
        </div>

        {/* Output Line Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Production Output</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={productionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: 'white' }}
              />
              <Legend />
              <Line type="monotone" dataKey="output" stroke="#F59E0B" strokeWidth={3} dot={{ fill: '#F59E0B', strokeWidth: 2 }} name="Output (units)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recipe Cards */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recipes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe, index) => (
            <Link
              key={recipe.id}
              to={`/recipes/${recipe.id}`}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              <div className={`h-2 bg-gradient-to-r ${
                index % 3 === 0 ? 'from-blue-500 to-blue-600' :
                index % 3 === 1 ? 'from-green-500 to-green-600' :
                'from-purple-500 to-purple-600'
              }`}></div>
              <div className="p-5">
                <h3 className="font-semibold text-lg text-gray-800 group-hover:text-blue-600 transition">
                  {recipe.name}
                </h3>
                <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                  {recipe.description || 'No description'}
                </p>
                <div className="mt-4 flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-gray-600">
                    <span className="text-blue-500">⚙️</span> {recipe.elements?.length || 0} elements
                  </span>
                  <span className="flex items-center gap-1 text-gray-600">
                    <span className="text-green-500">📊</span> {recipe.recordCount || 0} records
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {recipes.length === 0 && (
            <div className="col-span-full bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Recipes Yet</h3>
              <p className="text-gray-500 mb-4">Create your first recipe to get started!</p>
              <Link
                to="/recipes"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Create Recipe
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
