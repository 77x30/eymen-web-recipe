import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function BiometricVerification() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading, ready, capturing, processing, success, error
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [countdown, setCountdown] = useState(3);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    checkToken();
    return () => {
      // Cleanup camera on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [token]);

  const checkToken = async () => {
    try {
      const response = await api.get(`/auth/verification-status/${token}`);
      if (response.data.pending) {
        setUsername(response.data.username);
        setStatus('ready');
      }
    } catch (err) {
      setStatus('error');
      setError('Geçersiz veya süresi dolmuş doğrulama bağlantısı');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStatus('capturing');
      
      // Start countdown
      let count = 3;
      const countdownInterval = setInterval(() => {
        count--;
        setCountdown(count);
        if (count === 0) {
          clearInterval(countdownInterval);
          capturePhoto();
        }
      }, 1000);
    } catch (err) {
      setStatus('error');
      setError('Kamera erişimi reddedildi. Lütfen kamera izinlerini kontrol edin.');
    }
  };

  const capturePhoto = async () => {
    setStatus('processing');
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0);
      
      // Convert to base64
      const photoData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Stop camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Send to backend
      try {
        await api.post('/auth/verify-biometric', {
          token,
          photoData
        });
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setError('Doğrulama başarısız oldu. Lütfen tekrar deneyin.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="https://www.baridamakina.com/wp-content/uploads/2020/06/barida-logo.png" 
            alt="Barida Logo" 
            className="h-12 mx-auto mb-4 brightness-0 invert"
          />
          <h1 className="text-2xl font-bold text-white">Biyometrik Doğrulama</h1>
          <p className="text-gray-400 mt-1">Kimlik Doğrulama Sistemi</p>
        </div>

        {/* Card */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-700">
          
          {/* Loading State */}
          {status === 'loading' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Doğrulama bağlantısı kontrol ediliyor...</p>
            </div>
          )}

          {/* Ready State */}
          {status === 'ready' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="icon text-5xl text-blue-400">face</span>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Hoş geldiniz, {username}
              </h2>
              <p className="text-gray-400 mb-6">
                Kimliğinizi doğrulamak için yüzünüzü kameraya gösterin. 
                Fotoğrafınız güvenli bir şekilde saklanacaktır.
              </p>
              
              <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <span className="icon text-yellow-400">info</span>
                  <div className="text-left text-sm text-yellow-200">
                    <p className="font-semibold mb-1">Dikkat Edilmesi Gerekenler:</p>
                    <ul className="list-disc list-inside text-yellow-300/80 space-y-1">
                      <li>İyi aydınlatılmış bir ortamda olun</li>
                      <li>Yüzünüz tam olarak görünsün</li>
                      <li>Gözlük veya maske çıkarın</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={startCamera}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition"
              >
                <span className="icon">photo_camera</span>
                Kamerayı Başlat
              </button>
            </div>
          )}

          {/* Capturing State */}
          {status === 'capturing' && (
            <div className="text-center">
              <div className="relative rounded-xl overflow-hidden mb-4 bg-black">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className="w-full aspect-video object-cover"
                />
                {/* Face Guide Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-64 border-4 border-white/50 rounded-full"></div>
                </div>
                {/* Countdown */}
                {countdown > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="text-8xl font-bold text-white animate-pulse">{countdown}</span>
                  </div>
                )}
              </div>
              <p className="text-gray-400">Yüzünüzü çerçeve içine konumlandırın</p>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* Processing State */}
          {status === 'processing' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-white mb-2">İşleniyor...</h2>
              <p className="text-gray-400">Biyometrik verileriniz kaydediliyor</p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="icon text-5xl text-green-400">check_circle</span>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Doğrulama Başarılı!
              </h2>
              <p className="text-gray-400 mb-6">
                Kimliğiniz doğrulandı. Artık bu pencereyi kapatabilir ve 
                uygulamaya geri dönebilirsiniz.
              </p>
              <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
                <p className="text-green-300 text-sm">
                  Otomatik olarak giriş yapılacaksınız.
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="icon text-5xl text-red-400">error</span>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Bir Hata Oluştu
              </h2>
              <p className="text-gray-400 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
              >
                Tekrar Dene
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-600 text-sm">
          © 2026 Barida Makina • Güvenli Kimlik Doğrulama
        </div>
      </div>
    </div>
  );
}
