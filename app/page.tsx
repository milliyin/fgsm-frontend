"use client"
import React, { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [epsilon, setEpsilon] = useState<number>(0.1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [windowWidth, setWindowWidth] = useState<number>(1200);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const API_BASE = 'https://c7erwbv7hsgrdy4yd6q7pblmh40thlde.lambda-url.eu-north-1.on.aws';

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    // Set initial width
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

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

  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth <= 1024;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 25%, #3b82f6 50%, #ffffff 100%)',
      padding: isMobile ? '1rem' : '2rem',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background blobs */}
      <div 
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '300px',
          height: '300px',
          background: 'linear-gradient(45deg, #a855f7, #6366f1)',
          borderRadius: '50%',
          mixBlendMode: 'multiply',
          filter: 'blur(40px)',
          opacity: 0.7,
          zIndex: 0,
          pointerEvents: 'none',
          animation: 'blob 7s infinite'
        }}
      />
      <div 
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '350px',
          height: '350px',
          background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
          borderRadius: '50%',
          mixBlendMode: 'multiply',
          filter: 'blur(40px)',
          opacity: 0.7,
          zIndex: 0,
          pointerEvents: 'none',
          animation: 'blob 7s infinite',
          animationDelay: '2s'
        }}
      />

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 25px rgba(139, 92, 246, 0.3)'
            }}>
              <span style={{ color: 'white', fontSize: '24px' }}>⚡</span>
            </div>
            <h1 style={{
              fontSize: isMobile ? '2.5rem' : '4rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: '0',
              lineHeight: '1.1'
            }}>
              FGSM Attack Demo
            </h1>
          </div>
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgb(75, 85, 99)',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Explore adversarial attacks on MNIST handwritten digits using the Fast Gradient Sign Method
          </p>
        </div>

        {/* Main Content Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: isMobile ? '1.5rem' : '3rem',
          boxShadow: '0 20px 60px rgba(139, 92, 246, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          transition: 'all 0.3s ease'
        }}>
          {/* Upload and Controls */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isTablet ? '1fr' : '1fr 1fr',
            gap: '3rem',
            marginBottom: '3rem'
          }}>
            {/* Upload Section */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'rgb(55, 65, 81)',
                marginBottom: '1rem'
              }}>
                📁 Upload Your Image
              </label>
              
              <div style={{ position: 'relative' }}>
                <input
                  ref={fileInputRef}
                  onChange={onFileChange}
                  type="file"
                  accept="image/png, image/jpeg"
                  style={{
                    position: 'absolute',
                    inset: '0',
                    width: '100%',
                    height: '100%',
                    opacity: '0',
                    cursor: 'pointer',
                    zIndex: '10'
                  }}
                />
                <div style={{
                  border: '2px dashed rgba(139, 92, 246, 0.4)',
                  borderRadius: '16px',
                  padding: isMobile ? '2rem 1rem' : '3rem 2rem',
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.02) 0%, rgba(99, 102, 241, 0.02) 100%)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📷</div>
                  <div style={{
                    fontSize: '1.125rem',
                    fontWeight: '500',
                    color: 'rgb(55, 65, 81)',
                    marginBottom: '0.5rem'
                  }}>
                    Drop your image here or click to browse
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'rgb(107, 114, 128)'
                  }}>
                    PNG or JPEG format
                  </div>
                </div>
              </div>

              {previewUrl && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  marginTop: '1.5rem'
                }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: 'rgb(55, 65, 81)',
                    marginBottom: '1rem'
                  }}>
                    📋 Original Image
                  </h3>
                  <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '1rem',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
                  }}>
                    <div style={{
                      width: isMobile ? '150px' : '200px',
                      height: isMobile ? '150px' : '200px',
                      margin: '0 auto',
                      border: '2px solid rgba(229, 231, 235, 0.5)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      <img 
                        src={previewUrl} 
                        alt="preview" 
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Controls Section */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'rgb(55, 65, 81)',
                marginBottom: '1rem'
              }}>
                ⚡ Attack Parameters
              </label>
              
              <div style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
                borderRadius: '16px',
                padding: '2rem'
              }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: 'rgb(75, 85, 99)'
                    }}>
                      Epsilon Value
                    </span>
                    <span style={{
                      fontSize: '0.875rem',
                      fontFamily: 'monospace',
                      background: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      border: '1px solid rgba(229, 231, 235, 0.8)'
                    }}>
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
                    style={{
                      width: '100%',
                      height: '8px',
                      borderRadius: '4px',
                      background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.3) 50%, rgba(59, 130, 246, 0.2) 100%)',
                      outline: 'none',
                      appearance: 'none',
                      cursor: 'pointer',
                      margin: '1rem 0'
                    }}
                  />
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: 'rgb(107, 114, 128)',
                    marginTop: '0.5rem'
                  }}>
                    <span>0.000</span>
                    <span>0.500</span>
                    <span>1.000</span>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  marginBottom: '1.5rem'
                }}>
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
                    style={{
                      flex: '1',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      border: '2px solid rgba(229, 231, 235, 0.8)',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      background: 'white',
                      outline: 'none'
                    }}
                    placeholder="0.100"
                  />
                  <button
                    onClick={reset}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'rgba(107, 114, 128, 0.1)',
                      color: 'rgb(75, 85, 99)',
                      borderRadius: '12px',
                      transition: 'all 0.3s ease',
                      fontWeight: '500',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    🔄 Reset
                  </button>
                </div>

                <button
                  onClick={runAttack}
                  disabled={loading || !file}
                  style={{
                    width: '100%',
                    padding: '1rem 2rem',
                    borderRadius: '16px',
                    fontWeight: '600',
                    fontSize: '1.125rem',
                    border: 'none',
                    cursor: loading || !file ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    background: loading || !file ? 
                      'rgba(156, 163, 175, 0.5)' : 
                      'linear-gradient(135deg, #8b5cf6, #6366f1)',
                    color: loading || !file ? 'rgba(107, 114, 128, 0.7)' : 'white',
                    boxShadow: loading || !file ? 
                      'none' : 
                      '0 10px 30px rgba(139, 92, 246, 0.3)',
                    opacity: loading || !file ? '0.6' : '1'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && file) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading && file) {
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {loading ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem'
                    }}>
                      <div style={{
                        border: '2px solid transparent',
                        borderTop: '2px solid currentColor',
                        borderRadius: '50%',
                        width: '1.5rem',
                        height: '1.5rem',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Running Attack...
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}>
                      ⚡ Launch FGSM Attack
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* API Info */}
          <div style={{
            background: 'rgba(243, 244, 246, 0.8)',
            border: '1px solid rgba(209, 213, 219, 0.8)',
            borderRadius: '12px',
            padding: '1rem',
            fontSize: '0.875rem',
            color: 'rgb(75, 85, 99)',
            marginBottom: '2rem'
          }}>
            <div>
              🔗 API Endpoint: <code style={{
                background: 'rgba(229, 231, 235, 0.8)',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '0.75rem'
              }}>{API_BASE}</code>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div style={{
              background: 'rgba(254, 242, 242, 0.9)',
              border: '2px solid rgba(252, 165, 165, 0.8)',
              color: 'rgb(185, 28, 28)',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.5rem'
              }}>
                <span style={{ fontSize: '1.5rem' }}>❌</span>
                <div style={{
                  fontWeight: '600',
                  fontSize: '1.125rem'
                }}>
                  Error Occurred
                </div>
              </div>
              <div style={{ marginLeft: '2.75rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            </div>
          )}

          {/* Results Section */}
          {result && (
            <div style={{ marginTop: '3rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  fontWeight: '700',
                  color: 'rgb(55, 65, 81)',
                  marginBottom: '1rem'
                }}>
                  🎯 Attack Results
                </h2>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '30px',
                  fontSize: isMobile ? '1rem' : '1.125rem',
                  fontWeight: '600',
                  border: '2px solid',
                  background: result.success ? 
                    'rgba(240, 253, 244, 0.9)' : 
                    'rgba(254, 242, 242, 0.9)',
                  borderColor: result.success ? 
                    'rgba(34, 197, 94, 0.6)' : 
                    'rgba(239, 68, 68, 0.6)',
                  color: result.success ? 
                    'rgb(22, 101, 52)' : 
                    'rgb(185, 28, 28)'
                }}>
                  {result.success ? '✅ Attack Successful' : '❌ Attack Failed'}
                </div>
              </div>

              {/* Detailed Results */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: '2rem',
                marginBottom: '2rem'
              }}>
                {/* Original Results */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(239, 246, 255, 0.8) 0%, rgba(238, 242, 255, 0.8) 100%)',
                  border: '2px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '16px',
                  padding: '1.5rem'
                }}>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: 'rgb(55, 65, 81)',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    📊 Original Prediction
                  </h3>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: 'white',
                    borderRadius: '8px',
                    marginBottom: '0.75rem',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                  }}>
                    <span style={{
                      fontWeight: '500',
                      color: 'rgb(75, 85, 99)'
                    }}>
                      Predicted Digit:
                    </span>
                    <span style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: 'rgb(59, 130, 246)'
                    }}>
                      {result.original?.class ?? "—"}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: 'white',
                    borderRadius: '8px',
                    marginBottom: '0.75rem',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                  }}>
                    <span style={{
                      fontWeight: '500',
                      color: 'rgb(75, 85, 99)'
                    }}>
                      Confidence:
                    </span>
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: '0.875rem'
                    }}>
                      {(result.original?.confidence ?? 0).toFixed(4)}
                    </span>
                  </div>
                </div>

                {/* Adversarial Results */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(254, 242, 242, 0.8) 0%, rgba(253, 242, 248, 0.8) 100%)',
                  border: '2px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '16px',
                  padding: '1.5rem'
                }}>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: 'rgb(55, 65, 81)',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    🎭 Adversarial Prediction
                  </h3>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: 'white',
                    borderRadius: '8px',
                    marginBottom: '0.75rem',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                  }}>
                    <span style={{
                      fontWeight: '500',
                      color: 'rgb(75, 85, 99)'
                    }}>
                      Predicted Digit:
                    </span>
                    <span style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: 'rgb(239, 68, 68)'
                    }}>
                      {result.adversarial?.class ?? "—"}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: 'white',
                    borderRadius: '8px',
                    marginBottom: '0.75rem',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                  }}>
                    <span style={{
                      fontWeight: '500',
                      color: 'rgb(75, 85, 99)'
                    }}>
                      Confidence:
                    </span>
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: '0.875rem'
                    }}>
                      {(result.adversarial?.confidence ?? 0).toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Image Comparison */}
              {(previewUrl || result.advUrl) && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(255, 255, 255, 0.8) 25%, rgba(99, 102, 241, 0.05) 100%)',
                  border: '2px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '20px',
                  padding: isMobile ? '1.5rem' : '2rem',
                  marginTop: '2rem'
                }}>
                  <h3 style={{
                    fontSize: isMobile ? '1.25rem' : '1.5rem',
                    fontWeight: '700',
                    color: 'rgb(55, 65, 81)',
                    textAlign: 'center',
                    marginBottom: '2rem'
                  }}>
                    🖼️ Visual Comparison
                  </h3>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isTablet ? '1fr' : '1fr 1fr',
                    gap: '2rem'
                  }}>
                    {/* Original Image */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        display: 'inline-block',
                        marginBottom: '1rem'
                      }}>
                        Original Image
                      </div>
                      <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{
                          width: isMobile ? '12rem' : isTablet ? '16rem' : '18rem',
                          height: isMobile ? '12rem' : isTablet ? '16rem' : '18rem',
                          margin: '0 auto',
                          border: '2px solid rgba(229, 231, 235, 0.5)',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(249, 250, 251, 0.5)',
                          overflow: 'hidden'
                        }}>
                          {previewUrl ? (
                            <img 
                              src={previewUrl} 
                              style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain'
                              }}
                              alt="original large" 
                            />
                          ) : (
                            <div style={{
                              color: 'rgb(156, 163, 175)',
                              textAlign: 'center'
                            }}>
                              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📷</div>
                              <span style={{ fontSize: '0.875rem' }}>No original image</span>
                            </div>
                          )}
                        </div>
                        <div style={{
                          marginTop: '1rem',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            fontSize: '1.25rem',
                            fontWeight: '700',
                            color: 'rgb(59, 130, 246)',
                            marginBottom: '0.25rem'
                          }}>
                            Prediction: {result.original?.class ?? "—"}
                          </div>
                          <div style={{
                            fontSize: '0.875rem',
                            color: 'rgb(75, 85, 99)'
                          }}>
                            Confidence: {(result.original?.confidence ?? 0).toFixed(4)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Adversarial Image */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        display: 'inline-block',
                        marginBottom: '1rem'
                      }}>
                        Adversarial Image
                      </div>
                      <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{
                          width: isMobile ? '12rem' : isTablet ? '16rem' : '18rem',
                          height: isMobile ? '12rem' : isTablet ? '16rem' : '18rem',
                          margin: '0 auto',
                          border: '2px solid rgba(229, 231, 235, 0.5)',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(249, 250, 251, 0.5)',
                          overflow: 'hidden'
                        }}>
                          {result.advUrl ? (
                            <img 
                              src={result.advUrl} 
                              style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain'
                              }}
                              alt="adversarial large" 
                            />
                          ) : (
                            <div style={{
                              color: 'rgb(156, 163, 175)',
                              textAlign: 'center'
                            }}>
                              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>❓</div>
                              <span style={{ fontSize: '0.875rem' }}>No adversarial image</span>
                            </div>
                          )}
                        </div>
                        <div style={{
                          marginTop: '1rem',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            fontSize: '1.25rem',
                            fontWeight: '700',
                            color: 'rgb(239, 68, 68)',
                            marginBottom: '0.25rem'
                          }}>
                            Prediction: {result.adversarial?.class ?? "—"}
                          </div>
                          <div style={{
                            fontSize: '0.875rem',
                            color: 'rgb(75, 85, 99)'
                          }}>
                            Confidence: {(result.adversarial?.confidence ?? 0).toFixed(4)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Epsilon Display */}
                  <div style={{
                    textAlign: 'center',
                    marginTop: '2rem'
                  }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.75rem 1.5rem',
                      background: 'white',
                      border: '2px solid rgba(229, 231, 235, 0.8)',
                      borderRadius: '30px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                    }}>
                      <span style={{
                        color: 'rgb(75, 85, 99)',
                        fontWeight: '500'
                      }}>
                        Epsilon Used:
                      </span>
                      <span style={{
                        fontFamily: 'monospace',
                        fontSize: '1.125rem',
                        fontWeight: '700',
                        color: 'rgb(139, 92, 246)'
                      }}>
                        {epsilon.toFixed(3)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #6366f1);
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
          transition: all 0.3s ease;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.6);
        }
        
        input[type="range"]::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #6366f1);
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
          transition: all 0.3s ease;
          border: none;
        }
        
        input[type="range"]::-moz-range-track {
          background: linear-gradient(90deg, 
            rgba(139, 92, 246, 0.2) 0%, 
            rgba(99, 102, 241, 0.3) 50%, 
            rgba(59, 130, 246, 0.2) 100%);
          height: 8px;
          border-radius: 4px;
          border: none;
        }
      `}</style>
    </div>
  );
}
