"use client"
import React, { useState, useRef } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [epsilon, setEpsilon] = useState<number>(0.1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const API_BASE = 'https://c7erwbv7hsgrdy4yd6q7pblmh40thlde.lambda-url.eu-north-1.on.aws';

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setResult(null);
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }

  function reset() {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function runAttack() {
    if (!file) {
      setError('Please upload an image first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append('file', file, file.name);
      fd.append('epsilon', String(epsilon));

      const res = await fetch(`${API_BASE}/attack`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        },
        body: fd,
      }).catch(fetchError => {
        console.error('Fetch failed:', fetchError);
        if (fetchError.message.includes('CORS') || fetchError.message.includes('cross-origin')) {
          throw new Error('CORS error: The API server needs to allow requests from your domain. This is likely a server configuration issue.');
        }
        if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError')) {
          throw new Error('Network error: Cannot reach the API server. Check if the server is running and the URL is correct.');
        }
        throw fetchError;
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Server returned ${res.status}: ${txt}`);
      }

      const payload = await res.json();
      
      const advB64 = payload.adversarial_image_base64;
      const advUrl = advB64 ? `data:image/png;base64,${advB64}` : null;

      setResult({
        original: payload.original_prediction,
        adversarial: payload.adversarial_prediction,
        success: payload.attack_success,
        advUrl,
      });
    } catch (err: any) {
      console.error('Attack error:', err);
      setError(err.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-7xl">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                FGSM Attack Demo
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Explore adversarial attacks on MNIST handwritten digits using the Fast Gradient Sign Method
            </p>
          </div>

          {/* Main Content Card */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-12">
            {/* Upload and Controls Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
              {/* File Upload Section */}
              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-4">
                    📁 Upload Your Image
                  </label>
                  <div className="relative">
                    <input
                      ref={fileInputRef}
                      onChange={onFileChange}
                      type="file"
                      accept="image/png, image/jpeg"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="border-2 border-dashed border-purple-300 rounded-2xl p-8 text-center hover:border-purple-400 hover:bg-purple-50/50 transition-all duration-300">
                      <div className="text-4xl mb-4">📷</div>
                      <div className="text-lg font-medium text-gray-700">
                        Drop your image here or click to browse
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        PNG or JPEG format
                      </div>
                    </div>
                  </div>
                </div>

                {previewUrl && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">📋 Original Image</h3>
                    <div className="bg-white rounded-xl p-4 shadow-inner">
                      <div className="w-48 h-48 mx-auto border-2 border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                        <img 
                          src={previewUrl} 
                          alt="preview" 
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls Section */}
              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-4">
                    ⚡ Attack Parameters
                  </label>
                  
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-gray-700">Epsilon Value</span>
                        <span className="text-sm font-mono bg-white px-3 py-1 rounded-full border">
                          {epsilon.toFixed(3)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.001}
                        value={epsilon}
                        onChange={(e) => setEpsilon(Number(e.target.value))}
                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>0.000</span>
                        <span>0.500</span>
                        <span>1.000</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <input
                        type="number"
                        step={0.001}
                        min={0}
                        max={1}
                        value={epsilon}
                        onChange={(e) => {
                          let v = Number(e.target.value);
                          if (isNaN(v)) v = 0;
                          if (v < 0) v = 0;
                          if (v > 1) v = 1;
                          setEpsilon(v);
                        }}
                        className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none transition-colors"
                        placeholder="0.100"
                      />
                      <button
                        onClick={reset}
                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-medium"
                      >
                        🔄 Reset
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={runAttack}
                  disabled={loading || !file}
                  className={`w-full py-4 px-8 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                    loading || !file
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                      Running Attack...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      ⚡ Launch FGSM Attack
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* API Info */}
            <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-sm text-gray-600">
                🔗 API Endpoint: <code className="bg-gray-200 px-2 py-1 rounded font-mono text-xs">{API_BASE}</code>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-8 p-6 bg-red-50 border-2 border-red-200 text-red-700 rounded-2xl">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">❌</span>
                  <div className="font-semibold text-lg">Error Occurred</div>
                </div>
                <div className="ml-11 text-sm">{error}</div>
              </div>
            )}

            {/* Results Section */}
            {result && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">🎯 Attack Results</h2>
                  <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-bold ${
                    result.success 
                      ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                      : 'bg-red-100 text-red-800 border-2 border-red-300'
                  }`}>
                    {result.success ? '✅ Attack Successful' : '❌ Attack Failed'}
                  </div>
                </div>

                {/* Detailed Results */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Original Results */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      📊 Original Prediction
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="font-medium">Predicted Digit:</span>
                        <span className="text-2xl font-bold text-blue-600">{result.original?.class ?? "—"}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="font-medium">Class Index:</span>
                        <span className="font-mono text-lg">{result.original?.class_index ?? "—"}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="font-medium">Confidence:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${(result.original?.confidence ?? 0) * 100}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-sm">{(result.original?.confidence ?? 0).toFixed(4)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Adversarial Results */}
                  <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 border-2 border-red-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      🎭 Adversarial Prediction
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="font-medium">Predicted Digit:</span>
                        <span className="text-2xl font-bold text-red-600">{result.adversarial?.class ?? "—"}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="font-medium">Class Index:</span>
                        <span className="font-mono text-lg">{result.adversarial?.class_index ?? "—"}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="font-medium">Confidence:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${(result.adversarial?.confidence ?? 0) * 100}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-sm">{(result.adversarial?.confidence ?? 0).toFixed(4)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Side-by-Side Image Comparison */}
                <div className="bg-gradient-to-r from-purple-50 via-white to-indigo-50 rounded-2xl p-8 border-2 border-purple-200">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                    🖼️ Visual Comparison
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Original Image */}
                    <div className="text-center space-y-4">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-full font-semibold inline-block">
                        Original Image
                      </div>
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                        <div className="relative bg-white rounded-2xl p-6 shadow-lg">
                          <div className="w-72 h-72 mx-auto border-2 border-gray-200 rounded-xl flex items-center justify-center overflow-hidden bg-gray-50">
                            {previewUrl ? (
                              <img 
                                src={previewUrl} 
                                className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105" 
                                alt="original large" 
                              />
                            ) : (
                              <div className="text-gray-400 text-center">
                                <div className="text-4xl mb-2">📷</div>
                                <span className="text-sm">No original image</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-4 text-center">
                            <div className="text-lg font-bold text-blue-600">
                              Prediction: {result.original?.class ?? "—"}
                            </div>
                            <div className="text-sm text-gray-600">
                              Confidence: {(result.original?.confidence ?? 0).toFixed(4)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Adversarial Image */}
                    <div className="text-center space-y-4">
                      <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full font-semibold inline-block">
                        Adversarial Image
                      </div>
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-red-400 to-pink-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                        <div className="relative bg-white rounded-2xl p-6 shadow-lg">
                          <div className="w-72 h-72 mx-auto border-2 border-gray-200 rounded-xl flex items-center justify-center overflow-hidden bg-gray-50">
                            {result.advUrl ? (
                              <img 
                                src={result.advUrl} 
                                className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105" 
                                alt="adversarial large" 
                              />
                            ) : (
                              <div className="text-gray-400 text-center">
                                <div className="text-4xl mb-2">❓</div>
                                <span className="text-sm">No adversarial image</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-4 text-center">
                            <div className="text-lg font-bold text-red-600">
                              Prediction: {result.adversarial?.class ?? "—"}
                            </div>
                            <div className="text-sm text-gray-600">
                              Confidence: {(result.adversarial?.confidence ?? 0).toFixed(4)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Difference Indicator */}
                  <div className="mt-8 text-center">
                    <div className="inline-flex items-center gap-4 px-6 py-3 bg-white rounded-full border-2 border-gray-200 shadow-sm">
                      <span className="text-gray-700 font-medium">Epsilon Used:</span>
                      <span className="font-mono text-lg text-purple-600 font-bold">{epsilon.toFixed(3)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #3b82f6);
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #3b82f6);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
