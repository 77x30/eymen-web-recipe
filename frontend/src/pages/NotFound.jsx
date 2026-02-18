export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="relative z-10 text-center px-4">
        {/* Logo */}
        <img 
          src="https://www.baridamakina.com/wp-content/uploads/2020/06/barida-logo.png" 
          alt="Barida Logo" 
          className="h-12 mx-auto mb-8 brightness-0 invert opacity-50"
        />

        {/* 404 Icon */}
        <div className="w-32 h-32 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
          <span className="icon text-7xl text-red-400">error_outline</span>
        </div>

        {/* Error Message */}
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-300 mb-4">Workspace Bulunamadı</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-8">
          Aradığınız workspace mevcut değil veya artık aktif değil. 
          Lütfen doğru subdomain adresini kullandığınızdan emin olun.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href="https://barida.xyz" 
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
          >
            <span className="icon">home</span>
            Ana Sayfaya Dön
          </a>
          <a 
            href="mailto:destek@baridamakina.com" 
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
          >
            <span className="icon">mail</span>
            Destek İle İletişime Geç
          </a>
        </div>

        {/* Footer */}
        <div className="mt-12 text-gray-600 text-sm">
          © 2026 Barida Makina • Industrial Solutions
        </div>
      </div>
    </div>
  );
}
