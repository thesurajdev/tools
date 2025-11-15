'use client';

import { useState, useEffect } from 'react';
import ToolLayout from '@/components/ToolLayout';

type LinkType = 'html' | 'markdown' | 'bbcode' | 'raw';
type SpecialLinkType = 'none' | 'mailto' | 'tel' | 'whatsapp' | 'anchor';
type OutputTab = 'html' | 'markdown' | 'url' | 'bbcode';

export default function HyperlinkGenerator() {
  // Basic fields
  const [linkText, setLinkText] = useState('');
  const [url, setUrl] = useState('');
  const [openInNewTab, setOpenInNewTab] = useState(false);
  const [linkType, setLinkType] = useState<LinkType>('html');
  
  // Special link types
  const [specialLinkType, setSpecialLinkType] = useState<SpecialLinkType>('none');
  const [email, setEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [anchorId, setAnchorId] = useState('');
  
  // SEO & Advanced
  const [nofollow, setNofollow] = useState(false);
  const [sponsored, setSponsored] = useState(false);
  const [ugc, setUgc] = useState(false);
  const [ariaLabel, setAriaLabel] = useState('');
  const [titleAttr, setTitleAttr] = useState('');
  
  // UTM Parameters
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmTerm, setUtmTerm] = useState('');
  const [utmContent, setUtmContent] = useState('');
  
  // Link Status Checker
  const [linkStatus, setLinkStatus] = useState<{
    code: number | null;
    message: string;
    checking: boolean;
    isHttps: boolean;
  }>({ code: null, message: '', checking: false, isHttps: false });
  
  // UI state
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<OutputTab>('html');
  const [urlError, setUrlError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSpecial, setShowSpecial] = useState(false);
  const [showUtm, setShowUtm] = useState(false);
  const [shareUrlCopied, setShareUrlCopied] = useState(false);
  const [advancedTab, setAdvancedTab] = useState<'seo' | 'utm'>('utm');

  // Load from URL params on mount, then fallback to localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Priority 1: URL parameters (for sharing)
    if (params.get('text')) {
      setLinkText(params.get('text') || '');
      setUrl(params.get('url') || '');
      if (params.get('newtab') === 'true') setOpenInNewTab(true);
      if (params.get('utm_source')) setUtmSource(params.get('utm_source') || '');
      if (params.get('utm_medium')) setUtmMedium(params.get('utm_medium') || '');
      if (params.get('utm_campaign')) setUtmCampaign(params.get('utm_campaign') || '');
      if (params.get('utm_term')) setUtmTerm(params.get('utm_term') || '');
      if (params.get('utm_content')) setUtmContent(params.get('utm_content') || '');
    } else {
      // Priority 2: Auto-restore from localStorage
      try {
        const saved = localStorage.getItem('hyperlinkGenerator');
        if (saved) {
          const data = JSON.parse(saved);
          if (data.linkText) setLinkText(data.linkText);
          if (data.url) setUrl(data.url);
          if (data.openInNewTab) setOpenInNewTab(data.openInNewTab);
          if (data.utmSource) setUtmSource(data.utmSource);
          if (data.utmMedium) setUtmMedium(data.utmMedium);
          if (data.utmCampaign) setUtmCampaign(data.utmCampaign);
          if (data.utmTerm) setUtmTerm(data.utmTerm);
          if (data.utmContent) setUtmContent(data.utmContent);
        }
      } catch (error) {
        console.error('Failed to load saved data:', error);
      }
    }
  }, []);

  // Auto-save to localStorage whenever fields change
  useEffect(() => {
    if (linkText || url) {
      try {
        const dataToSave = {
          linkText,
          url,
          openInNewTab,
          utmSource,
          utmMedium,
          utmCampaign,
          utmTerm,
          utmContent,
          timestamp: Date.now()
        };
        localStorage.setItem('hyperlinkGenerator', JSON.stringify(dataToSave));
      } catch (error) {
        console.error('Failed to save data:', error);
      }
    }
  }, [linkText, url, openInNewTab, utmSource, utmMedium, utmCampaign, utmTerm, utmContent]);

  // Auto-clean URL
  const cleanURL = (inputUrl: string): string => {
    if (!inputUrl) return '';
    let cleaned = inputUrl.trim();
    
    // Remove spaces
    cleaned = cleaned.replace(/\s+/g, '');
    
    // Add https:// if missing protocol
    if (cleaned && !cleaned.match(/^[a-zA-Z][a-zA-Z\d+\-.]*:/)) {
      cleaned = 'https://' + cleaned;
    }
    
    return cleaned;
  };

  // Validate URL
  const validateURL = (inputUrl: string): boolean => {
    if (!inputUrl) return true;
    try {
      new URL(inputUrl);
      setUrlError('');
      return true;
    } catch {
      setUrlError('URL must start with http:// or https://');
      return false;
    }
  };

  // Check link status
  const checkLinkStatus = async (urlToCheck: string) => {
    if (!urlToCheck || !urlToCheck.startsWith('http')) return;
    
    setLinkStatus({ code: null, message: 'Checking...', checking: true, isHttps: urlToCheck.startsWith('https://') });
    
    try {
      // Use a CORS proxy or API route for production
      const response = await fetch(`/api/check-link?url=${encodeURIComponent(urlToCheck)}`, {
        method: 'HEAD',
      }).catch(() => ({ status: 0, ok: false }));
      
      const status = response.status;
      let message = '';
      
      if (status === 200) {
        message = 'OK - Link is working';
      } else if (status === 301 || status === 302) {
        message = 'Redirect - Consider using final URL';
      } else if (status === 404) {
        message = 'Not Found - Check your URL';
      } else if (status === 403) {
        message = 'Forbidden - Access denied';
      } else if (status === 500) {
        message = 'Server Error';
      } else if (status === 0) {
        message = 'Unable to check (CORS/Network)';
      } else {
        message = `Status ${status}`;
      }
      
      setLinkStatus({ 
        code: status, 
        message, 
        checking: false, 
        isHttps: urlToCheck.startsWith('https://') 
      });
    } catch (error) {
      setLinkStatus({ 
        code: null, 
        message: 'Unable to check link status', 
        checking: false, 
        isHttps: urlToCheck.startsWith('https://') 
      });
    }
  };

  // Handle URL change with auto-clean and status check
  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (value) {
      const cleaned = cleanURL(value);
      if (cleaned !== value) {
        setTimeout(() => {
          setUrl(cleaned);
          if (validateURL(cleaned)) {
            checkLinkStatus(cleaned);
          }
        }, 500);
      } else if (validateURL(cleaned)) {
        // Debounce the status check
        const timer = setTimeout(() => checkLinkStatus(cleaned), 1000);
        return () => clearTimeout(timer);
      }
    } else {
      setUrlError('');
      setLinkStatus({ code: null, message: '', checking: false, isHttps: false });
    }
  };

  // Generate final URL based on special link type
  const getFinalURL = (): string => {
    switch (specialLinkType) {
      case 'mailto':
        if (!email) return '';
        const params = new URLSearchParams();
        if (emailSubject) params.append('subject', emailSubject);
        if (emailBody) params.append('body', emailBody);
        const query = params.toString();
        return `mailto:${email}${query ? '?' + query : ''}`;
      
      case 'tel':
        return phone ? `tel:${phone.replace(/\s/g, '')}` : '';
      
      case 'whatsapp':
        if (!phone) return '';
        const cleanPhone = phone.replace(/\D/g, '');
        const msg = whatsappMessage ? `?text=${encodeURIComponent(whatsappMessage)}` : '';
        return `https://wa.me/${cleanPhone}${msg}`;
      
      case 'anchor':
        return anchorId ? `#${anchorId}` : '';
      
      default:
        const baseUrl = cleanURL(url);
        if (!baseUrl) return '';
        
        // Add UTM parameters for regular web links
        const utmParams = new URLSearchParams();
        if (utmSource) utmParams.append('utm_source', utmSource);
        if (utmMedium) utmParams.append('utm_medium', utmMedium);
        if (utmCampaign) utmParams.append('utm_campaign', utmCampaign);
        if (utmTerm) utmParams.append('utm_term', utmTerm);
        if (utmContent) utmParams.append('utm_content', utmContent);
        
        const utmString = utmParams.toString();
        if (!utmString) return baseUrl;
        
        // Check if URL already has query parameters
        const separator = baseUrl.includes('?') ? '&' : '?';
        return `${baseUrl}${separator}${utmString}`;
    }
  };

  // UTM Preset Templates
  const applyUtmPreset = (preset: string) => {
    switch (preset) {
      case 'email':
        setUtmSource('email');
        setUtmMedium('email');
        setUtmCampaign('');
        break;
      case 'social':
        setUtmSource('facebook');
        setUtmMedium('social');
        setUtmCampaign('');
        break;
      case 'paid':
        setUtmSource('google');
        setUtmMedium('cpc');
        setUtmCampaign('');
        break;
      case 'clear':
        setUtmSource('');
        setUtmMedium('');
        setUtmCampaign('');
        setUtmTerm('');
        setUtmContent('');
        break;
    }
  };

  // Generate rel attribute (following Google's best practices)
  const getRelAttribute = (): string => {
    const rels: string[] = [];
    
    // Always add noopener/noreferrer for security when opening in new tab
    if (openInNewTab) {
      rels.push('noopener', 'noreferrer');
    }
    
    // Primary link classification (mutually exclusive: sponsored OR ugc)
    if (sponsored) {
      rels.push('sponsored');
      // Can optionally add nofollow with sponsored
      if (nofollow) rels.push('nofollow');
    } else if (ugc) {
      rels.push('ugc');
      // Can optionally add nofollow with ugc
      if (nofollow) rels.push('nofollow');
    } else if (nofollow) {
      // Standalone nofollow (no sponsored/ugc)
      rels.push('nofollow');
    }
    
    return rels.length > 0 ? ` rel="${rels.join(' ')}"` : '';
  };

  // Generate output based on format
  const generateOutput = (format: OutputTab): string => {
    const finalUrl = getFinalURL();
    if (!linkText || !finalUrl) return '';

    const rel = getRelAttribute();
    const target = openInNewTab ? ' target="_blank"' : '';
    const aria = ariaLabel ? ` aria-label="${ariaLabel}"` : '';
    const title = titleAttr ? ` title="${titleAttr}"` : '';

    switch (format) {
      case 'html':
        return `<a href="${finalUrl}"${target}${rel}${aria}${title}>${linkText}</a>`;
      
      case 'markdown':
        return `[${linkText}](${finalUrl})`;
      
      case 'bbcode':
        return `[url=${finalUrl}]${linkText}[/url]`;
      
      case 'url':
        return finalUrl;
      
      default:
        return '';
    }
  };

  const currentOutput = generateOutput(activeTab);

  // Copy to clipboard
  const handleCopy = async () => {
    if (currentOutput) {
      await navigator.clipboard.writeText(currentOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Download as file
  const handleDownload = (format: 'html' | 'txt') => {
    const content = currentOutput;
    const blob = new Blob([content], { type: format === 'html' ? 'text/html' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hyperlink.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate shareable URL with all parameters
  const getShareableURL = () => {
    const params = new URLSearchParams();
    if (linkText) params.append('text', linkText);
    if (url) params.append('url', url);
    if (openInNewTab) params.append('newtab', 'true');
    if (utmSource) params.append('utm_source', utmSource);
    if (utmMedium) params.append('utm_medium', utmMedium);
    if (utmCampaign) params.append('utm_campaign', utmCampaign);
    if (utmTerm) params.append('utm_term', utmTerm);
    if (utmContent) params.append('utm_content', utmContent);
    const queryString = params.toString();
    return queryString ? `${window.location.origin}${window.location.pathname}?${queryString}` : window.location.href;
  };

  // Handle share URL copy
  const handleShareCopy = async () => {
    const shareUrl = getShareableURL();
    await navigator.clipboard.writeText(shareUrl);
    setShareUrlCopied(true);
    setTimeout(() => setShareUrlCopied(false), 2000);
  };

  // Reset form
  const handleReset = () => {
    setLinkText('');
    setUrl('');
    setOpenInNewTab(false);
    setSpecialLinkType('none');
    setEmail('');
    setEmailSubject('');
    setEmailBody('');
    setPhone('');
    setWhatsappMessage('');
    setAnchorId('');
    setNofollow(false);
    setSponsored(false);
    setUgc(false);
    setAriaLabel('');
    setTitleAttr('');
    setUrlError('');
    setUtmSource('');
    setUtmMedium('');
    setUtmCampaign('');
    setUtmTerm('');
    setUtmContent('');
  };

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Ctrl/Cmd + C: Copy output
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && currentOutput && !window.getSelection()?.toString()) {
        e.preventDefault();
        handleCopy();
      }
      // Ctrl/Cmd + R: Reset
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        handleReset();
      }
      // Ctrl/Cmd + S: Share/Copy shareable URL
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && currentOutput) {
        e.preventDefault();
        handleShareCopy();
      }
      // Ctrl/Cmd + K: Check link status
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && url && specialLinkType === 'none') {
        e.preventDefault();
        checkLinkStatus(cleanURL(url));
      }
      // Ctrl/Cmd + 1: Switch to HTML
      if ((e.ctrlKey || e.metaKey) && e.key === '1' && currentOutput) {
        e.preventDefault();
        setActiveTab('html');
      }
      // Ctrl/Cmd + 2: Switch to Markdown
      if ((e.ctrlKey || e.metaKey) && e.key === '2' && currentOutput) {
        e.preventDefault();
        setActiveTab('markdown');
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [currentOutput, url, specialLinkType]);

  return (
    <ToolLayout
      title="Free Hyperlink Generator with UTM Builder"
      subtitle="Create SEO-optimized HTML links, email links, phone links, and track campaigns with UTM parameters. No signup required."
      note="Generate HTML anchor tags, Markdown links, mailto links, tel links, WhatsApp links, and add UTM tracking codes instantly."
    >
      {/* TOOL SECTION */}
      <section id="tool" aria-label="Hyperlink Generator Tool" className="max-w-5xl mx-auto">
        {/* Main Card - Compact Layout */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          
          {/* Basic Inputs - Always Visible */}
          <section className="p-4 sm:p-6 space-y-4" aria-label="Link Generator Form">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Create Your Link</h2>
            <div>
              <label htmlFor="linkText" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Anchor Text / Link Text *
              </label>
              <input
                type="text"
                id="linkText"
                name="linkText"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Click here"
                aria-required="true"
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base"
              />
            </div>

            {/* Keyboard Shortcuts Info - Collapsed by default */}
            <details className="text-xs text-slate-500 dark:text-slate-400">
              <summary className="cursor-pointer font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 py-1">⌨️ Keyboard Shortcuts</summary>
              <div className="mt-2 space-y-1 text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                <div className="flex gap-2 flex-wrap">
                  <kbd className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded text-xs font-mono border border-slate-200 dark:border-slate-600">Ctrl+C</kbd> Copy
                  <kbd className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded text-xs font-mono border border-slate-200 dark:border-slate-600">Ctrl+R</kbd> Reset
                  <kbd className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded text-xs font-mono border border-slate-200 dark:border-slate-600">Ctrl+S</kbd> Share
                  <kbd className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded text-xs font-mono border border-slate-200 dark:border-slate-600">Ctrl+K</kbd> Check
                </div>
              </div>
            </details>

            {/* Link Type Selector with Icons */}
            <div>
              <label htmlFor="linkTypeSelector" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Link Type (URL, Email, Phone, WhatsApp, Anchor) *
              </label>
              <select
                id="linkTypeSelector"
                name="linkType"
                value={specialLinkType}
                onChange={(e) => setSpecialLinkType(e.target.value as SpecialLinkType)}
                aria-label="Select link type"
                aria-required="true"
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base"
              >
                <option value="none">Website URL</option>
                <option value="mailto">Email Link</option>
                <option value="tel">Phone Number</option>
                <option value="whatsapp">WhatsApp Message</option>
                <option value="anchor">Page Anchor</option>
              </select>
            </div>

            {/* Dynamic URL/Contact Input Based on Link Type */}
            {specialLinkType === 'none' && (
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Target URL / Website Address *
                </label>
                <input
                  type="url"
                  id="url"
                  name="url"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://example.com or example.com"
                  aria-required="true"
                  aria-invalid={!!urlError}
                  aria-describedby={urlError ? 'urlError' : 'urlHelp'}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base ${
                    urlError ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                  }`}
                />
                {urlError && (
                  <p id="urlError" className="text-sm text-red-600 mt-1" role="alert">{urlError}</p>
                )}
                
                {/* Link Status Checker */}
                {url && !urlError && (
                  <div className="mt-2 space-y-2">
                    <button
                      type="button"
                      onClick={() => checkLinkStatus(cleanURL(url))}
                      disabled={linkStatus.checking}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50"
                    >
                      {linkStatus.checking ? '⏳ Checking...' : '🔍 Check link'}
                    </button>
                    
                    {linkStatus.code !== null && (
                      <div className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded border ${
                        linkStatus.code === 200 ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800 text-green-700 dark:text-green-400' :
                        linkStatus.code === 301 || linkStatus.code === 302 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400' :
                        'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800 text-red-700 dark:text-red-400'
                      }`}>
                        {linkStatus.code === 200 ? '✓' : 
                         linkStatus.code === 301 || linkStatus.code === 302 ? '↻' : '✗'}
                        <span>{linkStatus.code} - {linkStatus.message}</span>
                      </div>
                    )}
                    
                    {!linkStatus.isHttps && url.startsWith('http://') && (
                      <div className="flex items-center gap-2 text-xs px-2 py-1.5 rounded border bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400">
                        <span>🔒</span>
                        <span>Not secure (HTTP) -</span>
                        <button
                          type="button"
                          onClick={() => setUrl(url.replace('http://', 'https://'))}
                          className="underline font-medium hover:text-amber-900 dark:hover:text-amber-200"
                        >
                          Use HTTPS
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {specialLinkType === 'mailto' && (
              <div className="space-y-3">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@example.com"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base"
                  />
                </div>
                <div>
                  <label htmlFor="emailSubject" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Subject (optional)
                  </label>
                  <input
                    type="text"
                    id="emailSubject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Hello!"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base"
                  />
                </div>
                <div>
                  <label htmlFor="emailBody" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Message Body (optional)
                  </label>
                  <textarea
                    id="emailBody"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Your message here..."
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base"
                  />
                </div>
              </div>
            )}

            {specialLinkType === 'tel' && (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base"
                />
              </div>
            )}

            {specialLinkType === 'whatsapp' && (
              <div className="space-y-3">
                <div>
                  <label htmlFor="whatsappPhone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    WhatsApp Number * <span className="text-xs text-slate-500">(with country code)</span>
                  </label>
                  <input
                    type="tel"
                    id="whatsappPhone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1234567890"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base"
                  />
                </div>
                <div>
                  <label htmlFor="whatsappMessage" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Pre-filled Message (optional)
                  </label>
                  <input
                    type="text"
                    id="whatsappMessage"
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                    placeholder="Hi there!"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base"
                  />
                </div>
              </div>
            )}

            {specialLinkType === 'anchor' && (
              <div>
                <label htmlFor="anchorId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Section ID * <span className="text-xs text-slate-500">(jumps to #section)</span>
                </label>
                <input
                  type="text"
                  id="anchorId"
                  value={anchorId}
                  onChange={(e) => setAnchorId(e.target.value)}
                  placeholder="faq"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base"
                />
              </div>
            )}

            {/* Quick Options Row */}
            <div className="flex flex-wrap gap-4 items-center pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={openInNewTab}
                  aria-label="Open link in new tab"
                  onClick={() => setOpenInNewTab(!openInNewTab)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    openInNewTab ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      openInNewTab ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Open in new tab (target="_blank")
                </label>
              </div>

            </div>

            {/* Advanced Options with Tabs - Only for regular web links */}
            {specialLinkType === 'none' && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  aria-expanded={showAdvanced}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-slate-100 to-blue-50 dark:from-slate-700 dark:to-blue-900/20 text-slate-700 dark:text-slate-300 rounded-lg hover:from-slate-200 hover:to-blue-100 dark:hover:from-slate-600 dark:hover:to-blue-900/30 transition-all text-sm font-medium flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-600"
                >
                  <svg className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Advanced Options (SEO & UTM)
                </button>
              </div>
            )}
          </section>

          {/* Advanced Options with Tabs - Only for regular links */}
          {showAdvanced && specialLinkType === 'none' && (
            <section className="border-t border-slate-200 dark:border-slate-700">
              {/* Tab Navigation */}
              <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setAdvancedTab('utm')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                    advancedTab === 'utm'
                      ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  UTM Tracking
                  {advancedTab === 'utm' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setAdvancedTab('seo')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                    advancedTab === 'seo'
                      ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  SEO Options
                  {advancedTab === 'seo' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></span>
                  )}
                </button>
              </div>

              {/* UTM Tab Content */}
              {advancedTab === 'utm' && (
                <div className="px-4 sm:px-6 py-4 bg-white dark:bg-slate-800">
                  <div className="mb-3">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">UTM Campaign Tracking</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Track campaigns in Google Analytics</p>
                  </div>

              {/* UTM Presets */}
              <div className="mb-4">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Quick Presets</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => applyUtmPreset('email')}
                    className="px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-xs font-medium border border-slate-200 dark:border-slate-600"
                  >
                    Email Campaign
                  </button>
                  <button
                    onClick={() => applyUtmPreset('social')}
                    className="px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-xs font-medium border border-slate-200 dark:border-slate-600"
                  >
                    Social Media
                  </button>
                  <button
                    onClick={() => applyUtmPreset('paid')}
                    className="px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-xs font-medium border border-slate-200 dark:border-slate-600"
                  >
                    Paid Ads
                  </button>
                  <button
                    onClick={() => applyUtmPreset('clear')}
                    className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-xs font-medium border border-red-200 dark:border-red-700"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* UTM Fields */}
              <div className="space-y-3">
                {/* Source */}
                <div>
                  <label htmlFor="utmSource" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Campaign Source * <span className="text-slate-400">(utm_source)</span>
                  </label>
                  <input
                    type="text"
                    id="utmSource"
                    name="utm_source"
                    value={utmSource}
                    onChange={(e) => setUtmSource(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder="google, newsletter, facebook"
                    aria-describedby="utmSourceHelp"
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                  />
                </div>

                {/* Medium */}
                <div>
                  <label htmlFor="utmMedium" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Campaign Medium * <span className="text-slate-400">(utm_medium)</span>
                  </label>
                  <input
                    type="text"
                    id="utmMedium"
                    name="utm_medium"
                    value={utmMedium}
                    onChange={(e) => setUtmMedium(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder="cpc, email, social, banner"
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                  />
                </div>

                {/* Campaign */}
                <div>
                  <label htmlFor="utmCampaign" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Campaign Name * <span className="text-slate-400">(utm_campaign)</span>
                  </label>
                  <input
                    type="text"
                    id="utmCampaign"
                    name="utm_campaign"
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder="spring_sale, product_launch"
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                  />
                </div>

                {/* Term (Optional) */}
                <div>
                  <label htmlFor="utmTerm" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Campaign Term <span className="text-slate-400">(utm_term) - Optional</span>
                  </label>
                  <input
                    type="text"
                    id="utmTerm"
                    name="utm_term"
                    value={utmTerm}
                    onChange={(e) => setUtmTerm(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder="running_shoes, blue_widget"
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                  />
                </div>

                {/* Content (Optional) */}
                <div>
                  <label htmlFor="utmContent" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Campaign Content <span className="text-slate-400">(utm_content) - Optional</span>
                  </label>
                  <input
                    type="text"
                    id="utmContent"
                    name="utm_content"
                    value={utmContent}
                    onChange={(e) => setUtmContent(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder="header_link, sidebar_cta"
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              {/* UTM Info Box */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <p className="text-xs text-blue-900 dark:text-blue-200 font-medium mb-1">UTM Best Practices:</p>
                <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-0.5 ml-4 list-disc">
                  <li>Use lowercase and underscores (auto-formatted)</li>
                  <li>Be consistent with naming conventions</li>
                  <li>Source, Medium, and Campaign are required for proper tracking</li>
                  <li>Use Term for paid keyword campaigns</li>
                  <li>Use Content for A/B testing different ad variants</li>
                </ul>
              </div>
                </div>
              )}

              {/* SEO Tab Content */}
              {advancedTab === 'seo' && (
                <div className="px-4 sm:px-6 py-4 bg-white dark:bg-slate-800">
                  <div className="mb-3">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">SEO Link Attributes</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Control how search engines treat your links</p>
                  </div>
              
              {/* SEO Rel Attributes */}
              <div className="mb-4">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Link Relationship (rel attribute)</p>
                
                {/* Primary Link Type - Radio Buttons (Mutually Exclusive) */}
                <div className="space-y-2 mb-3">
                  <label className="flex items-start gap-2.5 p-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <input
                      type="radio"
                      name="linkRelType"
                      checked={!sponsored && !ugc}
                      onChange={() => {
                        setSponsored(false);
                        setUgc(false);
                      }}
                      className="w-4 h-4 mt-0.5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Standard Link</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Default link without special attributes</p>
                    </div>
                  </label>
                  
                  <label className="flex items-start gap-2.5 p-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <input
                      type="radio"
                      name="linkRelType"
                      checked={sponsored}
                      onChange={(e) => {
                        setSponsored(e.target.checked);
                        setUgc(false);
                      }}
                      className="w-4 h-4 mt-0.5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Sponsored</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Paid, affiliate, or advertising links</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <input
                      type="radio"
                      name="linkRelType"
                      checked={ugc}
                      onChange={(e) => {
                        setUgc(e.target.checked);
                        setSponsored(false);
                      }}
                      className="w-4 h-4 mt-0.5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">User Generated</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Comments, forums, user-posted content</p>
                    </div>
                  </label>
                </div>

                {/* Optional Nofollow Checkbox */}
                <label className="flex items-center gap-2.5 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={nofollow}
                    onChange={(e) => setNofollow(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Add nofollow</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      Don't pass SEO ranking signals (can combine with sponsored or ugc)
                    </p>
                  </div>
                </label>

                {/* Helper Info */}
                <div className="mt-3 p-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <p className="text-xs text-blue-900 dark:text-blue-200 font-medium mb-1">
                    Valid Combinations:
                  </p>
                  <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-0.5 ml-4 list-disc">
                    <li><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">sponsored</code> or <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">sponsored nofollow</code></li>
                    <li><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">ugc</code> or <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">ugc nofollow</code></li>
                    <li><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">nofollow</code> (standalone)</li>
                  </ul>
                </div>
              </div>

              {/* Accessibility & UX */}
              <div className="space-y-2.5">
                <div>
                  <label htmlFor="titleAttr" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Title Attribute
                  </label>
                  <input
                    type="text"
                    id="titleAttr"
                    value={titleAttr}
                    onChange={(e) => setTitleAttr(e.target.value)}
                    placeholder="Tooltip text on hover"
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="ariaLabel" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    ARIA Label
                  </label>
                  <input
                    type="text"
                    id="ariaLabel"
                    value={ariaLabel}
                    onChange={(e) => setAriaLabel(e.target.value)}
                    placeholder="Screen reader text"
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>
                </div>
              )}
            </section>
          )}


          {/* Live Preview - Always Visible */}
          {currentOutput && (
            <section className="px-4 sm:px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700" aria-label="Link Preview">
              <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">Live Preview</h3>
              <a
                href={getFinalURL()}
                target={openInNewTab ? '_blank' : undefined}
                rel={getRelAttribute().replace(' rel="', '').replace('"', '') || undefined}
                aria-label={ariaLabel || undefined}
                title={titleAttr || undefined}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline text-base inline-flex items-center gap-2 break-all"
              >
                {linkText}
                {openInNewTab && (
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                )}
              </a>
            </section>
          )}

          {/* Generated Code - Format Tabs */}
          <section className="px-4 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-700" aria-label="Generated Code Output">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Generated HTML & Markdown Code</h3>
              {currentOutput && (
                <div className="flex gap-1" role="tablist" aria-label="Output format selection">
                  {(['html', 'markdown'] as OutputTab[]).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      aria-selected={activeTab === tab}
                      aria-controls="code-output"
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                        activeTab === tab
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {tab.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {currentOutput ? (
              <div id="code-output" className="relative" role="tabpanel">
                <pre className="bg-slate-900 dark:bg-slate-950 p-4 pr-24 rounded-lg text-xs sm:text-sm text-slate-100 overflow-x-auto font-mono" aria-label={`Generated ${activeTab.toUpperCase()} code`}>
                  <code className="break-all" lang={activeTab === 'html' ? 'html' : 'markdown'}>{currentOutput}</code>
                </pre>
                <button
                  onClick={handleCopy}
                  className={`absolute top-2 right-2 px-3 py-1.5 text-xs font-medium rounded transition-all flex items-center gap-1.5 ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700">
                <p className="text-slate-400 dark:text-slate-500 text-center text-sm">
                  Fill in the fields above to generate your hyperlink
                </p>
              </div>
            )}
          </section>

          {/* Action Buttons */}
          {currentOutput && (
            <section className="px-4 sm:px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700" aria-label="Export and Share Actions">
              <h3 className="sr-only">Download and Share Options</h3>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => handleDownload('html')}
                  aria-label="Download as HTML file"
                  className="px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download .html
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload('txt')}
                  aria-label="Download as text file"
                  className="px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download .txt
                </button>
              </div>
              <button
                type="button"
                onClick={handleShareCopy}
                aria-label="Copy shareable link to clipboard"
                className={`w-full px-3 py-2 rounded-lg transition-colors text-xs font-medium flex items-center justify-center gap-1.5 ${
                  shareUrlCopied 
                    ? 'bg-green-600 text-white' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  {shareUrlCopied ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  )}
                </svg>
                {shareUrlCopied ? 'Copied!' : 'Share Link'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                aria-label="Reset all form fields"
                className="w-full mt-2 px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-xs font-medium"
              >
                Reset All
              </button>
            </section>
          )}
        </div>
      </section>

      {/* CONTENT SECTION */}
      <article id="guide" aria-label="Hyperlink Guide and FAQs" className="max-w-4xl mx-auto mt-10">
        {/* Table of Contents */}
        <nav aria-label="Table of contents" className="mb-6 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">On this page</p>
          <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
            <li><a href="#how-it-works" className="hover:underline">How This Tool Works</a></li>
            <li><a href="#why-use" className="hover:underline">Why Use a Hyperlink Generator?</a></li>
            <li><a href="#how-to-create" className="hover:underline">How to Create a Hyperlink in HTML</a></li>
            <li><a href="#faqs" className="hover:underline">FAQs</a></li>
          </ul>
        </nav>

        {/* Educational Content - compact and SEO-friendly */}
        <section id="how-it-works" aria-label="How This Tool Works" className="mt-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">How This Tool Works</h2>
          <ol className="list-decimal ml-5 space-y-1 text-slate-700 dark:text-slate-300 text-sm">
            <li>Enter anchor text and select a link type.</li>
            <li>Paste your destination URL — we auto-clean and validate it.</li>
            <li>Use Advanced tabs to add SEO attributes or UTM tracking.</li>
            <li>Copy HTML/Markdown output and paste into your site or CMS.</li>
            <li>Share a prefilled link with your team to reuse settings.</li>
          </ol>
          <details className="mt-3 group">
            <summary className="cursor-pointer text-sm text-blue-600 dark:text-blue-400 hover:underline">Example HTML</summary>
            <pre className="mt-2 bg-slate-900 dark:bg-slate-950 p-3 rounded text-xs text-slate-100 overflow-x-auto"><code>&lt;a href="https://example.com?utm_source=newsletter&amp;utm_medium=email&amp;utm_campaign=spring_sale" rel="nofollow" target="_blank"&gt;Shop Spring Sale&lt;/a&gt;</code></pre>
          </details>
        </section>

        <section id="why-use" aria-label="Why Use a Hyperlink Generator" className="mt-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Why Use a Hyperlink Generator?</h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
            If you searched for an html link generator, hyperlink creator, href generator, or clickable link generator — this tool creates clean, SEO-friendly links in seconds.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Who it’s for</h3>
              <ul className="list-disc ml-4 space-y-1 text-slate-700 dark:text-slate-300">
                <li>Bloggers and content writers</li>
                <li>SEOs and marketers</li>
                <li>Developers and site owners</li>
              </ul>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Real use cases</h3>
              <ul className="list-disc ml-4 space-y-1 text-slate-700 dark:text-slate-300">
                <li>Create HTML links with proper rel attributes</li>
                <li>Add UTM parameters for campaigns</li>
                <li>Generate mailto/tel/WhatsApp links fast</li>
              </ul>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Benefits</h3>
              <ul className="list-disc ml-4 space-y-1 text-slate-700 dark:text-slate-300">
                <li>Cleaner code and fewer mistakes</li>
                <li>SEO-compliant link attributes</li>
                <li>Consistent UTM naming</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="how-to-create" aria-label="How to Create a Hyperlink in HTML" className="mt-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">How to Create a Hyperlink in HTML</h2>
          <details className="group">
            <summary className="cursor-pointer text-sm text-blue-600 dark:text-blue-400 hover:underline">Open step-by-step guide</summary>
            <div className="mt-3 space-y-4 text-sm text-slate-700 dark:text-slate-300">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">What is a hyperlink?</h3>
                <p>A hyperlink connects one page to another. In HTML it’s created with the <code className="font-mono">&lt;a&gt;</code> (anchor) tag.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">HTML hyperlink syntax</h3>
                <pre className="mt-2 bg-slate-900 dark:bg-slate-950 p-3 rounded text-xs text-slate-100 overflow-x-auto"><code>&lt;a href="https://example.com"&gt;Link text&lt;/a&gt;</code></pre>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Examples</h3>
                <pre className="mt-2 bg-slate-900 dark:bg-slate-950 p-3 rounded text-xs text-slate-100 overflow-x-auto"><code>{`<!-- Basic link -->
<a href="https://example.com">Visit Example</a>

<!-- Open in new tab (adds security attributes automatically in this tool) -->
<a href="https://example.com" target="_blank" rel="noopener noreferrer">Open in new tab</a>

<!-- Add UTM tracking -->
<a href="https://example.com?utm_source=instagram&utm_medium=social&utm_campaign=launch">Track campaign</a>`}</code></pre>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Internal vs external links</h3>
                <p>Internal links point within your site (great for navigation and SEO). External links go to other sites; use <code className="font-mono">rel</code> attributes like <code className="font-mono">nofollow</code>, <code className="font-mono">sponsored</code>, or <code className="font-mono">ugc</code> when appropriate.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">SEO anchor text best practices</h3>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Be descriptive (avoid “click here”)</li>
                  <li>Keep it concise and relevant</li>
                  <li>Match user intent and page content</li>
                </ul>
              </div>
            </div>
          </details>
        </section>

        <section id="faqs" aria-label="Hyperlink FAQs" className="mt-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">FAQs</h2>
          <div className="space-y-2">
            <details>
              <summary className="cursor-pointer text-sm font-medium text-slate-800 dark:text-slate-200">What is an HTML hyperlink?</summary>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">An HTML hyperlink uses the <code className="font-mono">&lt;a&gt;</code> tag to link to another page, file, or section.</p>
            </details>
            <details>
              <summary className="cursor-pointer text-sm font-medium text-slate-800 dark:text-slate-200">What is an anchor tag?</summary>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">The anchor tag (<code className="font-mono">&lt;a&gt;</code>) defines a hyperlink with an <code className="font-mono">href</code> destination.</p>
            </details>
            <details>
              <summary className="cursor-pointer text-sm font-medium text-slate-800 dark:text-slate-200">How do I open a link in a new tab?</summary>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">Use <code className="font-mono">target="_blank"</code>. This tool also adds <code className="font-mono">rel="noopener noreferrer"</code> for security.</p>
            </details>
            <details>
              <summary className="cursor-pointer text-sm font-medium text-slate-800 dark:text-slate-200">What is a nofollow link?</summary>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">A nofollow link includes <code className="font-mono">rel="nofollow"</code> to signal search engines not to pass ranking signals.</p>
            </details>
            <details>
              <summary className="cursor-pointer text-sm font-medium text-slate-800 dark:text-slate-200">What is a UTM link?</summary>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">A UTM link includes parameters like <code className="font-mono">utm_source</code>, <code className="font-mono">utm_medium</code>, and <code className="font-mono">utm_campaign</code> for analytics tracking.</p>
            </details>
            <details>
              <summary className="cursor-pointer text-sm font-medium text-slate-800 dark:text-slate-200">Does this tool support mailto/tel links?</summary>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">Yes. Choose Email Link or Phone Number to generate <code className="font-mono">mailto:</code> and <code className="font-mono">tel:</code> links.</p>
            </details>
          </div>
        </section>

      </article>
    </ToolLayout>
  );
}
