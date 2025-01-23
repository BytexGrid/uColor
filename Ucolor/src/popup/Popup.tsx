import React, { useState, useEffect } from 'react';

interface ElementFingerprint {
  textContent: string;
  tagName: string;
  href?: string;
  src?: string;
  alt?: string;
  ariaLabel?: string;
  role?: string;
  dimensions: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
  parentText: string;
  classes: string[];
}

interface ElementInfo {
  fingerprint: ElementFingerprint;
  tagName: string;
  path: string;
  currentColor: string;
  isGradient?: boolean;
  persistenceMode?: PersistenceMode;
}

interface ColorChange {
  fingerprint: ElementFingerprint;
  path: string;
  color: string;
  elementTag: string;
  timestamp: number;
  isGradient?: boolean;
}

// Add persistence mode type
type PersistenceMode = 'stable' | 'standard' | 'experimental' | 'aggressive';

// Add persistence mode descriptions
const PERSISTENCE_DESCRIPTIONS: Record<PersistenceMode, string> = {
  stable: 'Exact matches only - Best for static elements',
  standard: 'Balanced matching - Good for most elements',
  experimental: 'Structure-based matching - For dynamic content',
  aggressive: 'Maximum persistence - May have false matches'
};

const PERSISTENCE_MODES: PersistenceMode[] = ['stable', 'standard', 'experimental', 'aggressive'];

const rgbToHex = (color: string): string => {
  const rgb = color.match(/\d+/g);
  if (rgb && rgb.length >= 3) {
    return '#' + rgb.map((x: string) => {
      const hex = parseInt(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }
  return '#000000';
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString(undefined, { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const parseGradient = (gradientStr: string) => {
  // First try to match the rgb/hex format
  const match = gradientStr.match(/linear-gradient\(((?:\d+)(?:deg))?,\s*((?:rgb\([^)]+\)|#[a-fA-F0-9]{6}|[a-zA-Z]+)),\s*((?:rgb\([^)]+\)|#[a-fA-F0-9]{6}|[a-zA-Z]+))\)/);
  if (match) {
    const [, angle, color1, color2] = match;
    return {
      angle: angle ? parseInt(angle) : 90,
      stop1: color1.trim(),
      stop2: color2.trim()
    };
  }
  return null;
};

const Popup: React.FC = () => {
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<ColorChange[]>([]);
  const [isGradient, setIsGradient] = useState(false);
  const [gradientAngle, setGradientAngle] = useState(90);
  const [gradientStop1, setGradientStop1] = useState('#000000');
  const [gradientStop2, setGradientStop2] = useState('#ffffff');
  const [persistenceMode, setPersistenceMode] = useState<PersistenceMode>('standard');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab.id) {
        chrome.tabs.sendMessage(activeTab.id, { type: 'GET_HISTORY' }, (response) => {
          if (response?.changes) {
            setHistory(response.changes.sort((a: ColorChange, b: ColorChange) => b.timestamp - a.timestamp));
          }
        });
      }
    });
  };

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab.id) {
        chrome.tabs.sendMessage(activeTab.id, { type: 'GET_SELECTED_ELEMENT' }, (response) => {
          if (response?.hasSelected) {
            setSelectedElement(response.elementInfo);
            
            if (response.elementInfo.isGradient) {
              setIsGradient(true);
              const gradient = parseGradient(response.elementInfo.currentColor);
              if (gradient) {
                setGradientAngle(gradient.angle);
                setGradientStop1(gradient.stop1);
                setGradientStop2(gradient.stop2);
              }
            } else {
              setIsGradient(false);
              const color = response.elementInfo.currentColor;
              if (color.startsWith('rgb')) {
                setSelectedColor(rgbToHex(color));
              }
            }
          }
        });
      }
    });
  }, []);

  const startElementSelection = () => {
    setIsSelecting(true);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab.id) {
        chrome.tabs.sendMessage(activeTab.id, { type: 'START_PICKING' }, (response) => {
          if (response?.success) {
            // Keep popup open
            window.focus();
          }
        });
      }
    });
  };

  // Listen for element selection
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'ELEMENT_SELECTED') {
        setIsSelecting(false);
        setSelectedElement(message.elementInfo);
        
        if (message.elementInfo.isGradient) {
          setIsGradient(true);
          const gradient = parseGradient(message.elementInfo.currentColor);
          if (gradient) {
            setGradientAngle(gradient.angle);
            setGradientStop1(gradient.stop1);
            setGradientStop2(gradient.stop2);
          }
        } else {
          setIsGradient(false);
          const color = message.elementInfo.currentColor;
          if (color.startsWith('rgb')) {
            setSelectedColor(rgbToHex(color));
          }
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  const applyColor = () => {
    if (selectedElement) {
      const colorToApply = isGradient
        ? `${gradientAngle}deg, ${gradientStop1}, ${gradientStop2}`
        : selectedColor;

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab.id) {
          chrome.tabs.sendMessage(activeTab.id, {
            type: 'APPLY_COLOR',
            color: colorToApply,
            isGradient,
            persistenceMode
          });
        }
      });
    }
  };

  // Update color application to use applyColor
  useEffect(() => {
    applyColor();
  }, [selectedColor, isGradient, gradientAngle, gradientStop1, gradientStop2, selectedElement]);

  const resetElement = (fingerprint: ElementFingerprint) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab.id) {
        chrome.tabs.sendMessage(activeTab.id, {
          type: 'RESET_ELEMENT',
          fingerprint
        }, () => {
          loadHistory();
        });
      }
    });
  };

  const resetAll = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab.id) {
        chrome.tabs.sendMessage(activeTab.id, {
          type: 'RESET_ALL'
        }, () => {
          loadHistory();
          setSelectedElement(null);
        });
      }
    });
  };

  // Add this function to handle gradient toggle
  const handleGradientToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const useGradient = e.target.checked;
    setIsGradient(useGradient);
    
    if (useGradient && selectedColor) {
      // Use current color as the first gradient stop
      setGradientStop1(selectedColor);
      // Set a lighter version of the same color as the second stop
      setGradientStop2('#ffffff');
    }
  };

  return (
    <div className="popup">
      <div className="header">
        <h1>uColor</h1>
        <button 
          className="icon-button"
          onClick={() => setShowHistory(!showHistory)}
          title={showHistory ? "Back to picker" : "Show history"}
        >
          {showHistory ? "←" : "⏱"}
        </button>
      </div>

      {showHistory ? (
        <div className="history-panel">
          {history.length > 0 ? (
            <>
              <div className="history-header">
                <h2>Color History</h2>
                <button 
                  className="reset-all-button"
                  onClick={resetAll}
                >
                  Reset All
                </button>
              </div>
              <div className="history-list">
                {history.map((change) => (
                  <div key={`${change.fingerprint.textContent}-${change.timestamp}`} className="history-item">
                    <div className="history-item-info">
                      <span className="element-tag">{change.elementTag}</span>
                      <span className="timestamp">{formatTime(change.timestamp)}</span>
                    </div>
                    <div className="history-item-preview">
                      <div 
                        className="color-preview" 
                        style={{ 
                          background: change.isGradient 
                            ? `linear-gradient(${change.color})` 
                            : change.color 
                        }}
                      />
                      <button
                        className="reset-button"
                        onClick={() => resetElement(change.fingerprint)}
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="no-history">No color changes yet</p>
          )}
        </div>
      ) : (
        <>
          <button
            className={`select-button ${selectedElement ? 'secondary' : 'primary'}`}
            onClick={startElementSelection}
            disabled={isSelecting}
          >
            {isSelecting ? 'Selecting...' : selectedElement ? 'Select Another Element' : 'Select Element'}
          </button>

          {!selectedElement && !isSelecting && (
            <div className="instructions">
              <p>1. Click "Select Element" button</p>
              <p>2. Click any element on the page</p>
              <p>3. Click the uColor icon again</p>
              <p>4. Choose a color to apply</p>
            </div>
          )}
          
          {selectedElement && (
            <>
              <div className="selected-info">
                <p>Selected: <span className="element-tag">{selectedElement.tagName.toLowerCase()}</span></p>
              </div>
              
              <div className="color-type-toggle">
                <label>
                  <input
                    type="checkbox"
                    checked={isGradient}
                    onChange={handleGradientToggle}
                  />
                  Use Gradient
                </label>
              </div>

              {isGradient ? (
                <div className="gradient-picker">
                  <div className="gradient-controls">
                    <label className="angle-label">
                      Direction:
                      <input
                        type="number"
                        value={gradientAngle}
                        onChange={(e) => setGradientAngle(Number(e.target.value))}
                        min="0"
                        max="360"
                      />
                      <span>°</span>
                    </label>
                  </div>
                  <p className="gradient-help">Change angle (0-360°) to adjust gradient direction</p>
                  <div className="gradient-colors">
                    <input
                      type="color"
                      value={gradientStop1}
                      onChange={(e) => setGradientStop1(e.target.value)}
                    />
                    <input
                      type="color"
                      value={gradientStop2}
                      onChange={(e) => setGradientStop2(e.target.value)}
                    />
                  </div>
                  <div 
                    className="gradient-preview"
                    style={{
                      background: `linear-gradient(${gradientAngle}deg, ${gradientStop1}, ${gradientStop2})`
                    }}
                  />
                </div>
              ) : (
                <div className="color-picker">
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                  />
                  <input
                    type="text"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    placeholder="Enter color code"
                  />
                </div>
              )}

              <div className="persistence-mode">
                <label className="persistence-label">Persistence Mode:</label>
                <div className="persistence-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="3"
                    value={PERSISTENCE_MODES.indexOf(persistenceMode)}
                    onChange={(e) => setPersistenceMode(PERSISTENCE_MODES[Number(e.target.value)])}
                    className="persistence-slider"
                  />
                  <div className="persistence-ticks">
                    {PERSISTENCE_MODES.map((mode, index) => (
                      <div 
                        key={mode} 
                        className={`persistence-tick ${persistenceMode === mode ? 'active' : ''}`}
                        onClick={() => setPersistenceMode(mode)}
                      />
                    ))}
                  </div>
                </div>
                <div className="persistence-info">
                  <div className="persistence-mode-name">
                    {persistenceMode.charAt(0).toUpperCase() + persistenceMode.slice(1)}
                  </div>
                  <div className="persistence-description">
                    {PERSISTENCE_DESCRIPTIONS[persistenceMode]}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Popup; 