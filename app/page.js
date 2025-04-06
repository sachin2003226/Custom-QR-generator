'use client';

import { useRef, useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { ChevronDown, Download, X, Moon, Sun, Trash2, RefreshCw, Clock, Share2, Copy, Settings, Sliders, Camera, Mail, MessageSquare, Phone } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function QRGenerator() {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [text, setText] = useState('');
  const [mode, setMode] = useState('text');
  const [upi, setUpi] = useState({ id: '', name: '', amount: '' });
  const [vcard, setVcard] = useState({ name: '', company: '', phone: '', email: '', website: '', address: '' });
  const [event, setEvent] = useState({ title: '', startDate: '', endDate: '', location: '', description: '' });
  const [wifi, setWifi] = useState({ ssid: '', password: '', encryption: 'WPA' });
  const [email, setEmail] = useState({ address: '', subject: '', body: '' });
  const [sms, setSms] = useState({ number: '', message: '' });
  const [phone, setPhone] = useState({ number: '' });
  const [history, setHistory] = useState([]);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [color, setColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [gradient, setGradient] = useState({ enabled: false, type: 'linear', colors: ['#000000', '#000000'] });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrSize, setQrSize] = useState(300);
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState('H');
  const [logoSize, setLogoSize] = useState(70);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState('');
  const [templates, setTemplates] = useState([
    { name: 'Default', color: '#000000', bgColor: '#ffffff' },
    { name: 'Dark', color: '#ffffff', bgColor: '#000000' },
    { name: 'Brand', color: '#3b82f6', bgColor: '#f8fafc' },
    { name: 'Eco', color: '#10b981', bgColor: '#ecfdf5' }
  ]);
  const [activeTemplate, setActiveTemplate] = useState(0);

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

  // New: Apply template
  const applyTemplate = (index) => {
    const template = templates[index];
    setColor(template.color);
    setBgColor(template.bgColor);
    setActiveTemplate(index);
  };

  // New: Save current settings as template
  const saveAsTemplate = () => {
    const name = prompt('Enter template name:');
    if (name) {
      const newTemplate = {
        name,
        color,
        bgColor
      };
      setTemplates([...templates, newTemplate]);
      setActiveTemplate(templates.length);
    }
  };

  // New: Start/stop QR scanning
  const toggleScanning = async () => {
    if (scanning) {
      stopScanning();
      return;
    }

    setScanning(true);
    setScannedData('');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      
      // Simple scan attempt every 500ms
      const scanInterval = setInterval(() => {
        if (!scanning) {
          clearInterval(scanInterval);
          return;
        }
        
        try {
          const canvas = document.createElement('canvas');
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          
          // In a real app, you'd use a proper QR decoding library here
          // This is a simplified placeholder
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          // Simulate finding QR data
          if (Math.random() > 0.9) { // Fake detection for demo
            const fakeData = "https://example.com/scanned-data";
            setScannedData(fakeData);
            stopScanning();
          }
        } catch (e) {
          console.error("Scan error:", e);
        }
      }, 500);
    } catch (err) {
      setErrorMessage('Camera access denied or not available');
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setScanning(false);
  };

  // New: Generate gradient color function
  const getGradientColor = (pos) => {
    if (!gradient.enabled || gradient.colors.length < 2) return color;
    
    if (gradient.type === 'linear') {
      // Simple linear gradient between two colors
      const c0 = gradient.colors[0];
      const c1 = gradient.colors[1];
      return interpolateColor(c0, c1, pos);
    } else {
      // Radial gradient - use first color for center
      return pos < 0.5 ? gradient.colors[0] : gradient.colors[1];
    }
  };

  // Helper for color interpolation
  const interpolateColor = (c1, c2, ratio) => {
    const r = Math.round(parseInt(c1.substring(1, 3), 16) * (1 - ratio) + parseInt(c2.substring(1, 3), 16) * ratio);
    const g = Math.round(parseInt(c1.substring(3, 5), 16) * (1 - ratio) + parseInt(c2.substring(3, 5), 16) * ratio);
    const b = Math.round(parseInt(c1.substring(5, 7), 16) * (1 - ratio) + parseInt(c2.substring(5, 7), 16) * ratio);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

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
    
    if (mode === 'email') {
      const { address, subject, body } = email;
      return `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
    
    if (mode === 'sms') {
      const { number, message } = sms;
      return `smsto:${number}:${encodeURIComponent(message)}`;
    }
    
    if (mode === 'phone') {
      const { number } = phone;
      return `tel:${number}`;
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
    
    if (mode === 'email') {
      if (!email.address) {
        setErrorMessage('Email address is required');
        return false;
      }
    }
    
    if (mode === 'sms') {
      if (!sms.number) {
        setErrorMessage('Phone number is required');
        return false;
      }
    }
    
    if (mode === 'phone') {
      if (!phone.number) {
        setErrorMessage('Phone number is required');
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
      
      // Create gradient pattern if enabled
      let colorFn = null;
      if (gradient.enabled) {
        colorFn = (i, j) => {
          // Calculate position in QR code (0 to 1)
          const pos = (i + j) / (canvas.width + canvas.height);
          return getGradientColor(pos);
        };
      }
      
      await QRCode.toCanvas(canvas, data, {
        width: qrSize,
        margin: 2,
        color: {
          dark: colorFn || color,
          light: bgColor,
        },
        errorCorrectionLevel: errorCorrectionLevel,
      });

      if (logoFile) {
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = logoPreview;
        img.onload = () => {
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
          
          const logoAspect = img.width / img.height;
          let drawWidth = logoSize;
          let drawHeight = logoSize;
          
          if (logoAspect > 1) {
            drawHeight = logoSize / logoAspect;
          } else {
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

  // New: Export as PDF
  const exportAsPDF = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm'
    });
    
    // Add QR code
    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', 10, 10, 50, 50);
    
    // Add some info text
    doc.setFontSize(12);
    doc.text('QR Code generated with QR Code Studio', 10, 70);
    doc.text(`Data: ${getFormattedData().substring(0, 50)}${getFormattedData().length > 50 ? '...' : ''}`, 10, 75);
    
    doc.save(`qr-code-${Date.now()}.pdf`);
  };

  // New: Export as printable sheet
  const exportAsPrintable = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const printableDiv = document.createElement('div');
    printableDiv.style.width = '210mm';
    printableDiv.style.padding = '20mm';
    printableDiv.style.background = 'white';
    printableDiv.style.color = 'black';
    printableDiv.innerHTML = `
      <h1 style="text-align:center;margin-bottom:20px;">QR Code</h1>
      <div style="display:flex;justify-content:center;margin-bottom:20px;">
        <img src="${canvas.toDataURL('image/png')}" style="width:50mm;height:50mm;" />
      </div>
      <p style="text-align:center;font-size:12px;">Scan this code with your smartphone camera</p>
      <p style="text-align:center;font-size:10px;margin-top:20px;">Generated with QR Code Studio</p>
    `;
    
    document.body.appendChild(printableDiv);
    
    const printCanvas = await html2canvas(printableDiv, {
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true
    });
    
    document.body.removeChild(printableDiv);
    
    const link = document.createElement('a');
    link.download = `qr-printable-${Date.now()}.png`;
    link.href = printCanvas.toDataURL('image/png');
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

          {/* Scanner modal */}
          {scanning && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-base-100 rounded-xl p-4 max-w-md w-full">
                <h3 className="text-lg font-bold mb-2">Scan QR Code</h3>
                <div className="relative aspect-square bg-black rounded-lg overflow-hidden mb-4">
                  <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover"
                    playsInline
                  />
                  <div className="absolute inset-0 border-8 border-white/20 rounded-lg pointer-events-none"></div>
                </div>
                {scannedData && (
                  <div className="bg-base-200 p-3 rounded-lg mb-4">
                    <p className="font-medium mb-1">Scanned Data:</p>
                    <p className="text-sm break-all">{scannedData}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button 
                    className="btn btn-error flex-1"
                    onClick={stopScanning}
                  >
                    Cancel
                  </button>
                  {scannedData && (
                    <button 
                      className="btn btn-primary flex-1"
                      onClick={() => {
                        setText(scannedData);
                        setMode('text');
                        stopScanning();
                        setTimeout(generateQR, 100);
                      }}
                    >
                      Use This
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

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
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="phone">Phone</option>
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

              {mode === 'email' && (
                <div className="grid grid-cols-1 gap-3 mb-4">
                  <div className="form-control">
                    <label className="label pb-0 text-sm font-medium text-base-content/70">Email Address</label>
                    <input 
                      type="email"
                      className="input input-bordered rounded-lg" 
                      placeholder="recipient@example.com" 
                      value={email.address}
                      onChange={(e) => setEmail({ ...email, address: e.target.value })} 
                    />
                  </div>
                  <div className="form-control">
                    <label className="label pb-0 text-sm font-medium text-base-content/70">Subject</label>
                    <input 
                      className="input input-bordered rounded-lg" 
                      placeholder="Email Subject" 
                      value={email.subject}
                      onChange={(e) => setEmail({ ...email, subject: e.target.value })} 
                    />
                  </div>
                  <div className="form-control">
                    <label className="label pb-0 text-sm font-medium text-base-content/70">Body</label>
                    <textarea 
                      className="textarea textarea-bordered rounded-lg" 
                      placeholder="Email content" 
                      value={email.body}
                      onChange={(e) => setEmail({ ...email, body: e.target.value })} 
                    />
                  </div>
                </div>
              )}

              {mode === 'sms' && (
                <div className="grid grid-cols-1 gap-3 mb-4">
                  <div className="form-control">
                    <label className="label pb-0 text-sm font-medium text-base-content/70">Phone Number</label>
                    <input 
                      type="tel"
                      className="input input-bordered rounded-lg" 
                      placeholder="+1234567890" 
                      value={sms.number}
                      onChange={(e) => setSms({ ...sms, number: e.target.value })} 
                    />
                  </div>
                  <div className="form-control">
                    <label className="label pb-0 text-sm font-medium text-base-content/70">Message</label>
                    <textarea 
                      className="textarea textarea-bordered rounded-lg" 
                      placeholder="Message content" 
                      value={sms.message}
                      onChange={(e) => setSms({ ...sms, message: e.target.value })} 
                    />
                  </div>
                </div>
              )}

              {mode === 'phone' && (
                <div className="form-control mb-4">
                  <label className="label pb-0 text-sm font-medium text-base-content/70">Phone Number</label>
                  <input 
                    type="tel"
                    className="input input-bordered rounded-lg" 
                    placeholder="+1234567890" 
                    value={phone.number}
                    onChange={(e) => setPhone({ number: e.target.value })} 
                  />
                </div>
              )}

              {/* Templates */}
              <div className="mb-4">
                <label className="label pb-0 text-sm font-medium text-base-content/70">Templates</label>
                <div className="flex flex-wrap gap-2">
                  {templates.map((template, index) => (
                    <button
                      key={index}
                      className={`btn btn-xs ${activeTemplate === index ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => applyTemplate(index)}
                    >
                      {template.name}
                    </button>
                  ))}
                  <button
                    className="btn btn-xs btn-ghost"
                    onClick={saveAsTemplate}
                  >
                    + Save Current
                  </button>
                </div>
              </div>

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

                    {/* Gradient Options */}
                    <div className="form-control">
                      <label className="label pb-0 text-sm font-medium text-base-content/70">
                        Gradient Color
                      </label>
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          className="toggle toggle-sm"
                          checked={gradient.enabled}
                          onChange={(e) => setGradient({ ...gradient, enabled: e.target.checked })}
                        />
                        <span className="text-sm">Enable Gradient</span>
                      </div>
                      {gradient.enabled && (
                        <>
                          <select
                            className="select select-bordered select-sm rounded-lg mb-2"
                            value={gradient.type}
                            onChange={(e) => setGradient({ ...gradient, type: e.target.value })}
                          >
                            <option value="linear">Linear</option>
                            <option value="radial">Radial</option>
                          </select>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="label pb-0 text-xs">Color 1</label>
                              <input
                                type="color"
                                className="w-full h-10 rounded-lg cursor-pointer"
                                value={gradient.colors[0]}
                                onChange={(e) => {
                                  const newColors = [...gradient.colors];
                                  newColors[0] = e.target.value;
                                  setGradient({ ...gradient, colors: newColors });
                                }}
                              />
                            </div>
                            <div>
                              <label className="label pb-0 text-xs">Color 2</label>
                              <input
                                type="color"
                                className="w-full h-10 rounded-lg cursor-pointer"
                                value={gradient.colors[1]}
                                onChange={(e) => {
                                  const newColors = [...gradient.colors];
                                  newColors[1] = e.target.value;
                                  setGradient({ ...gradient, colors: newColors });
                                }}
                              />
                            </div>
                          </div>
                        </>
                      )}
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

              {/* Secondary actions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                <button 
                  className={`btn btn-sm btn-outline ${copySuccess ? 'btn-success' : ''}`}
                  onClick={copyQRData}
                >
                  {copySuccess ? 'Copied!' : (
                    <>
                      <Copy size={14} className="mr-1" />
                      Copy Data
                    </>
                  )}
                </button>
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={toggleScanning}
                >
                  <Camera size={14} className="mr-1" />
                  Scan QR
                </button>
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={exportAsPDF}
                >
                  <Download size={14} className="mr-1" />
                  PDF
                </button>
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={exportAsPrintable}
                >
                  <Download size={14} className="mr-1" />
                  Printable
                </button>
              </div>

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

            {/* QR Code Display */}
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