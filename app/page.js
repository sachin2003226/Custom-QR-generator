'use client';

import { useRef, useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { ChevronDown, Download, X, Moon, Sun, Trash2, RefreshCw, Clock, Share2, Copy, Settings, Sliders } from 'lucide-react';

export default function QRGenerator() {
  const canvasRef = useRef(null);
  const [text, setText] = useState('');
  const [mode, setMode] = useState('text');
  const [upi, setUpi] = useState({ id: '', name: '', amount: '' });
  const [vcard, setVcard] = useState({ name: '', company: '', phone: '', email: '', website: '', address: '' });
  const [event, setEvent] = useState({ title: '', startDate: '', endDate: '', location: '', description: '' });
  const [wifi, setWifi] = useState({ ssid: '', password: '', encryption: 'WPA' });
  const [history, setHistory] = useState([]);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [color, setColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrSize, setQrSize] = useState(300);
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState('H');
  const [logoSize, setLogoSize] = useState(70);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    // Initialize theme
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
    document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light';
    
    // Load history
    const saved = JSON.parse(localStorage.getItem('qr-history') || '[]');
    setHistory(saved);
    
    // Initial QR code generation with default text
    if (canvasRef.current) {
      setText('https://example.com');
      setTimeout(() => generateQR(), 500);
    }
  }, []);

  const saveToHistory = (value) => {
    const updated = [value, ...history.filter((v) => v !== value)].slice(0, 5);
    setHistory(updated);
    localStorage.setItem('qr-history', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('qr-history');
  };

  const getFormattedData = () => {
    if (mode === 'vcard') {
      const { name, company, phone, email, website, address } = vcard;
      const nameParts = name.split(' ');
      const lastName = nameParts.pop() || '';
      const firstName = nameParts.join(' ');
      
      return `BEGIN:VCARD
VERSION:3.0
N:${lastName};${firstName};;;
FN:${name}
ORG:${company}
TEL:${phone}
EMAIL:${email}
URL:${website}
ADR:;;${address};;;
END:VCARD`;
    }
    
    if (mode === 'event') {
      const { title, startDate, endDate, location, description } = event;
      // Format dates for iCal format
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };
      
      return `BEGIN:VEVENT
SUMMARY:${title}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
LOCATION:${location}
DESCRIPTION:${description}
END:VEVENT`;
    }
    
    if (mode === 'upi') {
      const { id, name, amount } = upi;
      return `upi://pay?pa=${id}&pn=${name}&am=${amount}&cu=INR`;
    }
    
    if (mode === 'wifi') {
      const { ssid, password, encryption } = wifi;
      return `WIFI:S:${ssid};T:${encryption};P:${password};;`;
    }
    
    return text;
  };

  const validateInput = () => {
    setErrorMessage('');
    
    if (mode === 'text' && !text.trim()) {
      setErrorMessage('Please enter text or a URL');
      return false;
    }
    
    if (mode === 'upi') {
      if (!upi.id) {
        setErrorMessage('UPI ID is required');
        return false;
      }
    }
    
    if (mode === 'vcard') {
      if (!vcard.name) {
        setErrorMessage('Name is required');
        return false;
      }
    }
    
    if (mode === 'event') {
      if (!event.title || !event.startDate) {
        setErrorMessage('Event title and start date are required');
        return false;
      }
    }
    
    if (mode === 'wifi') {
      if (!wifi.ssid) {
        setErrorMessage('WiFi SSID is required');
        return false;
      }
    }
    
    return true;
  };

  const generateQR = async () => {
    if (!validateInput()) return;
    
    const data = getFormattedData();
    setIsGenerating(true);
    
    try {
      const canvas = canvasRef.current;
      await QRCode.toCanvas(canvas, data, {
        width: qrSize,
        margin: 2,
        color: {
          dark: color,
          light: bgColor,
        },
        errorCorrectionLevel: errorCorrectionLevel,
      });

      if (logoFile) {
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = logoPreview;
        img.onload = () => {
          // Create white background for logo
          ctx.fillStyle = bgColor;
          const padding = 5;
          const logoPosX = (canvas.width - logoSize - padding * 2) / 2;
          const logoPosY = (canvas.height - logoSize - padding * 2) / 2;
          
          ctx.fillRect(
            logoPosX,
            logoPosY,
            logoSize + padding * 2,
            logoSize + padding * 2
          );
          
          // Draw logo at original aspect ratio
          const logoAspect = img.width / img.height;
          let drawWidth = logoSize;
          let drawHeight = logoSize;
          
          if (logoAspect > 1) {
            // Wider image
            drawHeight = logoSize / logoAspect;
          } else {
            // Taller image
            drawWidth = logoSize * logoAspect;
          }
          
          ctx.drawImage(
            img,
            (canvas.width - drawWidth) / 2,
            (canvas.height - drawHeight) / 2,
            drawWidth,
            drawHeight
          );
        };
      }

      if (mode === 'text') saveToHistory(text);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQR = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `qr-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const shareQR = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    try {
      const blob = await new Promise(resolve => canvas.toBlob(resolve));
      const file = new File([blob], 'qr-code.png', { type: 'image/png' });
      
      if (navigator.share) {
        await navigator.share({
          title: 'QR Code',
          files: [file],
        });
      } else {
        setErrorMessage('Sharing is not supported on this browser');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to share QR code');
    }
  };

  const copyQRData = () => {
    const data = getFormattedData();
    navigator.clipboard.writeText(data)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(() => {
        setErrorMessage('Failed to copy data');
      });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setErrorMessage('Please upload a valid image file (PNG, JPG)');
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (canvasRef.current) {
      // Regenerate without logo
      generateQR();
    }
  };

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.dataset.theme = newMode ? 'dark' : 'light';
  };

  return (
    <main className="min-h-screen bg-base-200 flex items-center justify-center p-2 md:p-6">
      <div className="card bg-base-100 shadow-xl rounded-2xl w-full max-w-3xl">
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <rect x="7" y="7" width="3" height="3"/>
                <rect x="14" y="7" width="3" height="3"/>
                <rect x="7" y="14" width="3" height="3"/>
                <rect x="14" y="14" width="3" height="3"/>
              </svg>
              QR Code Studio
            </h1>
            <button 
              className="btn btn-sm btn-circle btn-ghost"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="order-2 md:order-1">
              {/* Mode selector */}
              <div className="form-control mb-4">
                <div className="relative">
                  <select 
                    className="select select-bordered w-full pr-10 appearance-none bg-base-100 rounded-lg"
                    value={mode} 
                    onChange={(e) => setMode(e.target.value)}
                  >
                    <option value="text">Text / URL</option>
                    <option value="vcard">Contact (vCard)</option>
                    <option value="event">Calendar Event</option>
                    <option value="upi">UPI Payment</option>
                    <option value="wifi">WiFi Network</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" size={18} />
                </div>
              </div>

              {/* Dynamic inputs based on mode */}
              {mode === 'text' && (
                <div className="form-control mb-4">
                  <input
                    type="text"
                    placeholder="Enter text or URL"
                    className="input input-bordered w-full rounded-lg"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                </div>
              )}

              {mode === 'upi' && (
                <div className="grid grid-cols-1 gap-3 mb-4">
                  <div className="form-control">
                    <label className="label pb-0 text-sm font-medium text-base-content/70">UPI ID</label>
                    <input 
                      className="input input-bordered rounded-lg" 
                      placeholder="example@upi" 
                      value={upi.id}
                      onChange={(e) => setUpi({ ...upi, id: e.target.value })} 
                    />
                  </div>
                  <div className="form-control">
                    <label className="label pb-0 text-sm font-medium text-base-content/70">Name</label>
                    <input 
                      className="input input-bordered rounded-lg" 
                      placeholder="Recipient Name" 
                      value={upi.name}
                      onChange={(e) => setUpi({ ...upi, name: e.target.value })} 
                    />
                  </div>
                  <div className="form-control">
                    <label className="label pb-0 text-sm font-medium text-base-content/70">Amount</label>
                    <input 
                      className="input input-bordered rounded-lg" 
                      placeholder="₹ Amount" 
                      type="number"
                      value={upi.amount}
                      onChange={(e) => setUpi({ ...upi, amount: e.target.value })} 
                    />
                  </div>
                </div>
              )}

              {mode === 'vcard' && (
                <div className="grid grid-cols-1 gap-2 mb-4">
                  <div className="form-control">
                    <label className="label pb-0 text-sm font-medium text-base-content/70">Full Name</label>
                    <input 
                      className="input input-bordered rounded-lg" 
                      placeholder="John Doe" 
                      value={vcard.name}
                      onChange={(e) => setVcard({ ...vcard, name: e.target.value })} 
                    />
                  </div>
                  <div className="form-control">
                    <label className="label pb-0 text-sm font-medium text-base-content/70">Company</label>
                    <input 
                      className="input input-bordered rounded-lg" 
                      placeholder="Company Name" 
                      value={vcard.company}
                      onChange={(e) => setVcard({ ...vcard, company: e.target.value })} 
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="form-control">
                      <label className="label pb-0 text-sm font-medium text-base-content/70">Phone</label>
                      <input 
                        className="input input-bordered rounded-lg" 
                        placeholder="Phone Number" 
                        value={vcard.phone}
                        onChange={(e) => setVcard({ ...vcard, phone: e.target.value })} 
                      />
                    </div>
                    <div className="form-control">
                      <label className="label pb-0 text-sm font-medium text-base-content/70">Email</label>
                      <input 
                        className="input input-bordered rounded-lg" 
                        placeholder="email@example.com" 
                        value={vcard.email}
                        onChange={(e) => setVcard({ ...vcard, email: e.target.value })} 
                      />
                    </div>
                  </div>
                  <div className="form-control">
                    <label className="label pb-0 text-sm font-medium text-base-content/70">Website</label>
                    <input 
                      className="input input-bordered rounded-lg" 
                      placeholder="https://example.com" 
                      value={vcard.website}
                      onChange={(e) => setVcard({ ...vcard, website: e.target.value })} 
                    />
                  </div>
                  <div className="form-control">
                    <label className="label pb-0 text-sm font-medium text-base-content/70">Address</label>
                    <input 
                      className="input input-bordered rounded-lg" 
                      placeholder="123 Main St, City, Country" 
                      value={vcard.address}
                      onChange={(e) => setVcard({ ...vcard, address: e.target.value })} 
                    />
                  </div>
                </div>
              )}

              {mode === 'event' && (
                <div className="grid grid-cols-1 gap-3 mb-4">
                  <div className="form-control">
                    <label className="label pb-0 text-sm font-medium text-base-content/70">Event Title</label>
                    <input 
                      className="input input-bordered rounded-lg" 
                      placeholder="Meeting Title" 
                      value={event.title}
                      onChange={(e) => setEvent({ ...event, title: e.target.value })} 
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="form-control">
                      <label className="label pb-0 text-sm font-medium text-base-content/70">Start Date & Time</label>
                      <input 
                        type="datetime-local" 
                        className="input input-bordered rounded-lg" 
                        value={event.startDate}
                        onChange={(e) => setEvent({ ...event, startDate: e.target.value })} 
                      />
                    </div>
                    <div className="form-control">
                      <label className="label pb-0 text-sm font-medium text-base-content/70">End Date & Time</label>
                      <input 
                        type="datetime-local" 
                        className="input input-bordered rounded-lg" 
                        value={event.endDate}
                        onChange={(e) => setEvent({ ...event, endDate: e.target.value })} 
                      />
                    </div>
                  </div>
                  <div className="form-control">
                    <label className="label pb-0 text-sm font-medium text-base-content/70">Location</label>
                    <input 
                      className="input input-bordered rounded-lg" 
                      placeholder="Event location" 
                      value={event.location}
                      onChange={(e) => setEvent({ ...event, location: e.target.value })} 
                    />
                  </div>
                  <div className="form-control">
                    <label className="label pb-0 text-sm font-medium text-base-content/70">Description</label>
                    <textarea 
                      className="textarea textarea-bordered rounded-lg" 
                      placeholder="Event details" 
                      value={event.description}
                      onChange={(e) => setEvent({ ...event, description: e.target.value })} 
                    />
                  </div>
                </div>
              )}

              {mode === 'wifi' && (
                <div className="grid grid-cols-1 gap-3 mb-4">
                  <div className="form-control">
                    <label className="label pb-0 text-sm font-medium text-base-content/70">Network Name (SSID)</label>
                    <input 
                      className="input input-bordered rounded-lg" 
                      placeholder="WiFi Network Name" 
                      value={wifi.ssid}
                      onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })} 
                    />
                  </div>
                  <div className="form-control">
                    <label className="label pb-0 text-sm font-medium text-base-content/70">Password</label>
                    <input 
                      type="password"
                      className="input input-bordered rounded-lg" 
                      placeholder="WiFi Password" 
                      value={wifi.password}
                      onChange={(e) => setWifi({ ...wifi, password: e.target.value })} 
                    />
                  </div>
                  <div className="form-control">
                    <label className="label pb-0 text-sm font-medium text-base-content/70">Encryption Type</label>
                    <select 
                      className="select select-bordered rounded-lg"
                      value={wifi.encryption}
                      onChange={(e) => setWifi({ ...wifi, encryption: e.target.value })}
                    >
                      <option value="WPA">WPA/WPA2</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">No Password</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Advanced Options Toggle */}
              <div className="collapse collapse-arrow border rounded-lg mb-4">
                <input 
                  type="checkbox" 
                  checked={showAdvancedOptions}
                  onChange={() => setShowAdvancedOptions(!showAdvancedOptions)}
                />
                <div className="collapse-title font-medium flex items-center">
                  <Settings size={16} className="mr-2" />
                  Advanced Options
                </div>
                <div className="collapse-content">
                  <div className="grid grid-cols-1 gap-3">
                    {/* QR Code Size */}
                    <div className="form-control">
                      <label className="label pb-0 text-sm font-medium text-base-content/70">
                        QR Size: {qrSize}x{qrSize}px
                      </label>
                      <input
                        type="range"
                        min="200"
                        max="600"
                        step="50"
                        value={qrSize}
                        onChange={(e) => setQrSize(parseInt(e.target.value))}
                        className="range range-primary range-sm"
                      />
                      <div className="flex justify-between text-xs text-base-content/70 px-1">
                        <span>Small</span>
                        <span>Large</span>
                      </div>
                    </div>

                    {/* QR Error Correction Level */}
                    <div className="form-control">
                      <label className="label pb-0 text-sm font-medium text-base-content/70">
                        Error Correction Level
                      </label>
                      <select
                        className="select select-bordered select-sm rounded-lg"
                        value={errorCorrectionLevel}
                        onChange={(e) => setErrorCorrectionLevel(e.target.value)}
                      >
                        <option value="L">Low (7%)</option>
                        <option value="M">Medium (15%)</option>
                        <option value="Q">Quartile (25%)</option>
                        <option value="H">High (30%)</option>
                      </select>
                      <p className="text-xs text-base-content/70 mt-1">
                        Higher levels allow more damage to the QR code while remaining scannable
                      </p>
                    </div>

                    {/* Logo Size */}
                    {logoPreview && (
                      <div className="form-control">
                        <label className="label pb-0 text-sm font-medium text-base-content/70">
                          Logo Size: {logoSize}px
                        </label>
                        <input
                          type="range"
                          min="40"
                          max="120"
                          step="10"
                          value={logoSize}
                          onChange={(e) => setLogoSize(parseInt(e.target.value))}
                          className="range range-primary range-sm"
                        />
                        <div className="flex justify-between text-xs text-base-content/70 px-1">
                          <span>Small</span>
                          <span>Large</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* QR Style Controls and Logo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="form-control">
                  <label className="label pb-0 text-sm font-medium text-base-content/70">QR Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label pb-0 text-xs">QR Color</label>
                      <input 
                        type="color" 
                        className="w-full h-10 rounded-lg cursor-pointer" 
                        value={color} 
                        onChange={(e) => setColor(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="label pb-0 text-xs">Background</label>
                      <input 
                        type="color" 
                        className="w-full h-10 rounded-lg cursor-pointer" 
                        value={bgColor} 
                        onChange={(e) => setBgColor(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                <div className="form-control">
                  <label className="label pb-0 text-sm font-medium text-base-content/70">Logo (optional)</label>
                  {!logoPreview ? (
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload} 
                        className="file-input file-input-bordered file-input-sm w-full rounded-lg" 
                        id="logo-upload"
                      />
                    </div>
                  ) : (
                    <div className="relative h-20">
                      <img 
                        src={logoPreview} 
                        alt="logo" 
                        className="h-full object-contain bg-white rounded-lg p-1" 
                      />
                      <button 
                        className="btn btn-xs btn-circle btn-error absolute top-1 right-1" 
                        onClick={removeLogo}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Error message */}
              {errorMessage && (
                <div className="alert alert-error mb-3 rounded-lg py-2 text-sm">
                  {errorMessage}
                </div>
              )}

              {/* Action buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                <button 
                  className={`btn btn-primary col-span-2 ${isGenerating ? 'loading' : ''} rounded-lg`} 
                  onClick={generateQR}
                  disabled={isGenerating}
                >
                  {isGenerating ? <RefreshCw className="animate-spin mr-2" size={16} /> : null}
                  Generate QR
                </button>
                <button 
                  className="btn btn-outline rounded-lg" 
                  onClick={downloadQR}
                >
                  <Download size={16} className="mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Download</span>
                </button>
                <button 
                  className="btn btn-outline rounded-lg" 
                  onClick={shareQR}
                >
                  <Share2 size={16} className="mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              </div>

              {/* Secondary action */}
              <button 
                className={`btn btn-sm btn-ghost w-full mb-4 ${copySuccess ? 'btn-success' : ''}`}
                onClick={copyQRData}
              >
                {copySuccess ? 'Copied!' : (
                  <>
                    <Copy size={14} className="mr-2" />
                    Copy QR Data
                  </>
                )}
              </button>

              {/* History section */}
              {history.length > 0 && (
                <div className="border-t border-base-300 pt-3">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-md font-semibold flex items-center gap-2">
                      <Clock size={14} />
                      Recent QR Codes
                    </h3>
                    <button 
                      className="btn btn-ghost btn-xs" 
                      onClick={clearHistory}
                    >
                      <Trash2 size={14} className="mr-1" />
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {history.map((item, idx) => (
                      <button 
                        key={idx} 
                        className="badge badge-outline py-2 px-2 rounded-full hover:bg-base-200 transition-colors text-xs" 
                        onClick={() => {
                          setText(item);
                          setMode('text');
                          setTimeout(generateQR, 100);
                        }}
                      >
                        {item.length > 20 ? item.slice(0, 20) + '…' : item}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* QR Code Display - Always the right side on md+ screens */}
            <div className="order-1 md:order-2 flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm p-4 mb-4 md:mb-0">
              <canvas 
                ref={canvasRef} 
                width={qrSize} 
                height={qrSize} 
                className="rounded-lg"
                style={{ maxWidth: '100%', height: 'auto' }} 
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}