let selectedElement: HTMLElement | null = null;
let isPickerActive = false;

// Add styles for highlighted elements
const style = document.createElement('style');
style.textContent = `
  .ucolor-hover {
    outline: 2px dashed #4CAF50 !important;
    outline-offset: 2px !important;
  }
`;
document.head.appendChild(style);

function handleMouseOver(e: MouseEvent) {
  if (!isPickerActive) return;
  
  const target = e.target as HTMLElement;
  if (target === selectedElement) return;
  
  // Remove previous highlight
  document.querySelectorAll('.ucolor-hover').forEach(el => 
    el.classList.remove('ucolor-hover')
  );
  
  // Add highlight to current element
  target.classList.add('ucolor-hover');
}

function handleMouseOut(e: MouseEvent) {
  if (!isPickerActive) return;
  const target = e.target as HTMLElement;
  target.classList.remove('ucolor-hover');
}

function getCurrentElementStyle(element: HTMLElement): { color: string; isGradient: boolean } {
  const computedStyle = window.getComputedStyle(element);
  const background = computedStyle.background;
  const backgroundColor = computedStyle.backgroundColor;
  
  // Check if it's a gradient
  if (background.includes('gradient')) {
    // Try to parse the gradient into a consistent format
    const match = background.match(/linear-gradient\(((?:\d+)(?:deg))?,\s*((?:rgb\([^)]+\)|#[a-fA-F0-9]{6}|[a-zA-Z]+)),\s*((?:rgb\([^)]+\)|#[a-fA-F0-9]{6}|[a-zA-Z]+))\)/);
    if (match) {
      const [, angle, color1, color2] = match;
      // Return in a consistent format
      return { 
        color: `linear-gradient(${angle ? angle : '90deg'}, ${color1.trim()}, ${color2.trim()})`,
        isGradient: true 
      };
    }
  }
  
  // Return solid color
  return { color: backgroundColor, isGradient: false };
}

// Add persistence mode types at the top
type PersistenceMode = 'stable' | 'standard' | 'experimental' | 'aggressive';

// Add these new interfaces near the top with other interfaces
interface ViewportPosition {
  isInViewport: boolean;
  relativePosition: {
    fromTop: number;
    fromLeft: number;
  };
}

interface VisualCharacteristics {
  fontSize: string;
  textAlign: string;
  display: string;
  isVisible: boolean;
}

interface ElementStructure {
  siblingTypes: string[];
  relativePositionInParent: number;
  inHeader: boolean;
  inFooter: boolean;
  inNav: boolean;
  inMain: boolean;
  inAside: boolean;
}

// Add new interfaces for enhanced fingerprinting
interface DOMTreeContext {
  depthFromRoot: number;
  siblingCount: number;
  similarSiblingsCount: number;
  nearestLandmarks: {
    header?: number;
    nav?: number;
    main?: number;
    aside?: number;
    footer?: number;
  };
  childrenCount: number;
}

interface VisualLayout {
  zIndex: number;
  stackingContext: boolean;
  marginPattern: string;
  paddingPattern: string;
  isInFlexContainer: boolean;
  isInGridContainer: boolean;
  relativeSize: {
    toParent: number;
    toViewport: number;
  };
  gridPosition?: {
    row: number;
    column: number;
  };
}

interface EnhancedCharacteristics {
  computedStylesHash: string;
  hasEventListeners: boolean;
  ariaAttributes: Record<string, string>;
  dataAttributes: Record<string, string>;
  interactiveType: string;
  isClickable: boolean;
}

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
  persistenceMode?: PersistenceMode; // Add this field
  viewportPosition?: ViewportPosition;
  visualCharacteristics?: VisualCharacteristics;
  elementStructure?: ElementStructure;
  domTreeContext?: DOMTreeContext;
  visualLayout?: VisualLayout;
  enhancedCharacteristics?: EnhancedCharacteristics;
}

// Update scoring thresholds to reflect new scoring system
const PERSISTENCE_THRESHOLDS: Record<PersistenceMode, number> = {
  stable: 120,    // Must match most critical criteria
  standard: 80,   // Should match important criteria
  experimental: 50, // Can match some key criteria
  aggressive: 30   // Matches minimal criteria
};

interface ColorChange {
  fingerprint: ElementFingerprint;
  path: string;
  color: string;
  elementTag: string;
  timestamp: number;
  isGradient?: boolean;
}

interface StorageData {
  [url: string]: ColorChange[];
}

// Add function to generate unique IDs
function generateUniqueId(): string {
  return 'ucolor-' + Math.random().toString(36).substr(2, 9);
}

// Add function to get or create element ID
function getOrCreateElementId(element: HTMLElement): string {
  let id = element.getAttribute('data-ucolor-id');
  if (!id) {
    id = generateUniqueId();
    element.setAttribute('data-ucolor-id', id);
  }
  return id;
}

// Add fingerprinting and scoring functions
function cleanText(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
}

// Add helper function to get viewport position
function getViewportPosition(element: HTMLElement): ViewportPosition {
  const rect = element.getBoundingClientRect();
  return {
    isInViewport: rect.top >= 0 && rect.top <= window.innerHeight,
    relativePosition: {
      fromTop: rect.top / window.innerHeight,
      fromLeft: rect.left / window.innerWidth
    }
  };
}

// Add helper function to get visual characteristics
function getVisualCharacteristics(element: HTMLElement): VisualCharacteristics {
  const computedStyle = window.getComputedStyle(element);
  return {
    fontSize: computedStyle.fontSize,
    textAlign: computedStyle.textAlign,
    display: computedStyle.display,
    isVisible: computedStyle.display !== 'none' && 
               computedStyle.visibility !== 'hidden' &&
               computedStyle.opacity !== '0'
  };
}

// Add helper function to get element structure
function getElementStructure(element: HTMLElement): ElementStructure {
  const parent = element.parentElement;
  const siblings = parent ? Array.from(parent.children) : [];
  const position = siblings.indexOf(element);

  return {
    siblingTypes: siblings.map(s => s.tagName.toLowerCase()),
    relativePositionInParent: siblings.length ? position / siblings.length : 0,
    inHeader: !!element.closest('header'),
    inFooter: !!element.closest('footer'),
    inNav: !!element.closest('nav'),
    inMain: !!element.closest('main'),
    inAside: !!element.closest('aside')
  };
}

// Add helper functions for new fingerprinting aspects
function getDOMTreeContext(element: HTMLElement): DOMTreeContext {
  let depth = 0;
  let current = element;
  while (current.parentElement) {
    depth++;
    current = current.parentElement;
  }

  const siblings = element.parentElement?.children || [];
  const similarSiblings = Array.from(siblings).filter(sibling => 
    sibling.tagName === element.tagName && 
    sibling.className === element.className
  );

  const nearestLandmarks: DOMTreeContext['nearestLandmarks'] = {};
  ['header', 'nav', 'main', 'aside', 'footer'].forEach(landmark => {
    const nearest = element.closest(landmark);
    if (nearest) {
      const distance = getElementDistance(element, nearest as HTMLElement);
      nearestLandmarks[landmark as keyof DOMTreeContext['nearestLandmarks']] = distance;
    }
  });

  return {
    depthFromRoot: depth,
    siblingCount: siblings.length,
    similarSiblingsCount: similarSiblings.length,
    nearestLandmarks,
    childrenCount: element.children.length
  };
}

function getVisualLayout(element: HTMLElement): VisualLayout {
  const computedStyle = window.getComputedStyle(element);
  const parentStyle = window.getComputedStyle(element.parentElement!);
  
  const rect = element.getBoundingClientRect();
  const parentRect = element.parentElement!.getBoundingClientRect();

  return {
    zIndex: parseInt(computedStyle.zIndex) || 0,
    stackingContext: computedStyle.position !== 'static' || computedStyle.zIndex !== 'auto',
    marginPattern: `${computedStyle.marginTop}-${computedStyle.marginRight}-${computedStyle.marginBottom}-${computedStyle.marginLeft}`,
    paddingPattern: `${computedStyle.paddingTop}-${computedStyle.paddingRight}-${computedStyle.paddingBottom}-${computedStyle.paddingLeft}`,
    isInFlexContainer: parentStyle.display.includes('flex'),
    isInGridContainer: parentStyle.display.includes('grid'),
    relativeSize: {
      toParent: (rect.width * rect.height) / (parentRect.width * parentRect.height),
      toViewport: (rect.width * rect.height) / (window.innerWidth * window.innerHeight)
    },
    gridPosition: parentStyle.display.includes('grid') ? {
      row: parseInt(computedStyle.gridRowStart) || 0,
      column: parseInt(computedStyle.gridColumnStart) || 0
    } : undefined
  };
}

function getEnhancedCharacteristics(element: HTMLElement): EnhancedCharacteristics {
  const computedStyle = window.getComputedStyle(element);
  const relevantStyles = [
    'color', 'backgroundColor', 'fontSize', 'fontWeight', 'display',
    'position', 'borderRadius', 'boxShadow', 'textAlign'
  ];
  
  const stylesHash = relevantStyles
    .map(prop => `${prop}:${computedStyle.getPropertyValue(prop)}`)
    .join(';');

  const ariaAttributes: Record<string, string> = {};
  const dataAttributes: Record<string, string> = {};
  
  Array.from(element.attributes).forEach(attr => {
    if (attr.name.startsWith('aria-')) {
      ariaAttributes[attr.name] = attr.value;
    } else if (attr.name.startsWith('data-')) {
      dataAttributes[attr.name] = attr.value;
    }
  });

  return {
    computedStylesHash: stylesHash,
    hasEventListeners: element.onclick !== null || element.onmousedown !== null || element.onmouseup !== null,
    ariaAttributes,
    dataAttributes,
    interactiveType: getInteractiveType(element),
    isClickable: isElementClickable(element)
  };
}

function getInteractiveType(element: HTMLElement): string {
  if (element instanceof HTMLButtonElement) return 'button';
  if (element instanceof HTMLInputElement) return `input-${element.type}`;
  if (element instanceof HTMLAnchorElement) return 'link';
  if (element.getAttribute('role')) return `role-${element.getAttribute('role')}`;
  return 'none';
}

function isElementClickable(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  return !!(
    element.onclick || 
    element.getAttribute('role') === 'button' ||
    element instanceof HTMLButtonElement ||
    element instanceof HTMLAnchorElement ||
    computedStyle.cursor === 'pointer'
  );
}

function getElementDistance(a: HTMLElement, b: HTMLElement): number {
  let distance = 0;
  let current = a;
  while (current && current !== b && current !== document.body) {
    distance++;
    current = current.parentElement!;
  }
  return current === b ? distance : Infinity;
}

// Update getElementFingerprint to include new properties
function getElementFingerprint(element: HTMLElement): ElementFingerprint {
  const rect = element.getBoundingClientRect();
  const parent = element.parentElement;
  
  const fingerprint: ElementFingerprint = {
    textContent: cleanText(element.textContent || ''),
    tagName: element.tagName.toLowerCase(),
    href: element instanceof HTMLAnchorElement ? element.href : undefined,
    src: element instanceof HTMLImageElement ? element.src : undefined,
    alt: element instanceof HTMLImageElement ? element.alt : undefined,
    ariaLabel: element.getAttribute('aria-label') || undefined,
    role: element.getAttribute('role') || undefined,
    dimensions: {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      x: Math.round(rect.x),
      y: Math.round(rect.y)
    },
    parentText: parent ? cleanText(parent.textContent || '') : '',
    classes: Array.from(element.classList),
    persistenceMode: element.getAttribute('data-ucolor-persistence') as PersistenceMode || 'standard'
  };

  // Only add enhanced properties for aggressive mode
  if (fingerprint.persistenceMode === 'aggressive') {
    fingerprint.viewportPosition = getViewportPosition(element);
    fingerprint.visualCharacteristics = getVisualCharacteristics(element);
    fingerprint.elementStructure = getElementStructure(element);
    fingerprint.domTreeContext = getDOMTreeContext(element);
    fingerprint.visualLayout = getVisualLayout(element);
    fingerprint.enhancedCharacteristics = getEnhancedCharacteristics(element);
  }

  return fingerprint;
}

// Update scoreElementMatch with new scoring system
function scoreElementMatch(fingerprint: ElementFingerprint, element: HTMLElement): number {
  let score = 0;
  const elementFingerprint = getElementFingerprint(element);

  // 1. Structural Anchors (40 points)
  if (fingerprint.elementStructure && elementFingerprint.elementStructure) {
    const fs = fingerprint.elementStructure;
    const es = elementFingerprint.elementStructure;
    
    // Direct landmark parent matches
    if ((fs.inHeader && es.inHeader) || 
        (fs.inNav && es.inNav) || 
        (fs.inMain && es.inMain) || 
        (fs.inAside && es.inAside) || 
        (fs.inFooter && es.inFooter)) {
      score += 20;
    }

    // Position relative to landmarks
    if (fingerprint.domTreeContext && elementFingerprint.domTreeContext) {
      const fd = fingerprint.domTreeContext;
      const ed = elementFingerprint.domTreeContext;
      
      // Check distances to landmarks
      let landmarkDistanceMatch = true;
      for (const landmark of ['header', 'nav', 'main', 'aside', 'footer'] as const) {
        if (fd.nearestLandmarks[landmark] !== undefined && 
            ed.nearestLandmarks[landmark] !== undefined) {
          if (fd.nearestLandmarks[landmark] !== ed.nearestLandmarks[landmark]) {
            landmarkDistanceMatch = false;
          }
        }
      }
      if (landmarkDistanceMatch) score += 20;
    }
  }

  // 2. Interactive Identity (35 points)
  if (fingerprint.enhancedCharacteristics && elementFingerprint.enhancedCharacteristics) {
    const fc = fingerprint.enhancedCharacteristics;
    const ec = elementFingerprint.enhancedCharacteristics;
    
    // Role and ARIA
    if (fingerprint.role === elementFingerprint.role) score += 15;
    if (fingerprint.ariaLabel === elementFingerprint.ariaLabel) score += 10;
    if (JSON.stringify(fc.ariaAttributes) === JSON.stringify(ec.ariaAttributes)) score += 10;
    
    // Interactive behavior
    if (fc.interactiveType === ec.interactiveType) score += 15;
    if (fc.hasEventListeners === ec.hasEventListeners) score += 10;
    if (fc.isClickable === ec.isClickable) score += 10;
  }

  // 3. Visual Signature (30 points)
  if (fingerprint.visualLayout && elementFingerprint.visualLayout) {
    const vl = fingerprint.visualLayout;
    const el = elementFingerprint.visualLayout;
    
    // Layout context
    if (vl.isInFlexContainer === el.isInFlexContainer) score += 10;
    if (vl.isInGridContainer === el.isInGridContainer) score += 10;
    if (Math.abs(vl.relativeSize.toParent - el.relativeSize.toParent) < 0.1) score += 10;
    
    // Style patterns
    if (fingerprint.enhancedCharacteristics?.computedStylesHash === 
        elementFingerprint.enhancedCharacteristics?.computedStylesHash) {
      score += 15;
    }
    if (vl.marginPattern === el.marginPattern) score += 10;
    if (vl.paddingPattern === el.paddingPattern) score += 5;
  }

  // 4. Content Identity (25 points)
  if (fingerprint.textContent && elementFingerprint.textContent) {
    if (fingerprint.textContent === elementFingerprint.textContent) {
      score += 25;
    } else if (elementFingerprint.textContent.includes(fingerprint.textContent)) {
      score += 15;
    } else if (fingerprint.textContent.length > 0 && 
               elementFingerprint.textContent.length > 0 && 
               fingerprint.textContent.length === elementFingerprint.textContent.length) {
      score += 10;
    }
  }

  // 5. Element Properties (20 points)
  if (fingerprint.tagName === elementFingerprint.tagName) score += 10;
  if (fingerprint.href === elementFingerprint.href) score += 10;
  if (fingerprint.src === elementFingerprint.src) score += 10;
  if (fingerprint.alt === elementFingerprint.alt) score += 5;

  // 6. DOM Position (15 points)
  if (fingerprint.domTreeContext && elementFingerprint.domTreeContext) {
    const fd = fingerprint.domTreeContext;
    const ed = elementFingerprint.domTreeContext;
    
    if (fd.siblingCount === ed.siblingCount) score += 8;
    if (fd.similarSiblingsCount === ed.similarSiblingsCount) score += 7;
    if (fd.depthFromRoot === ed.depthFromRoot) score += 8;
    
    // Parent context through text
    if (fingerprint.parentText === elementFingerprint.parentText) score += 7;
  }

  // 7. Class-based Identity (15 points)
  const commonClasses = fingerprint.classes.filter(c => 
    elementFingerprint.classes.includes(c)
  );
  if (commonClasses.length === fingerprint.classes.length) {
    score += 15;
  } else if (commonClasses.length > 0) {
    score += Math.min(10, commonClasses.length * 2);
  }

  return score;
}

function findElementByFingerprint(fingerprint: ElementFingerprint): HTMLElement | null {
  const elements = Array.from(document.getElementsByTagName(fingerprint.tagName)) as HTMLElement[];
  let bestMatch: HTMLElement | null = null;
  let bestScore = 0;
  
  // Get the threshold based on persistence mode
  const threshold = PERSISTENCE_THRESHOLDS[fingerprint.persistenceMode || 'standard'];
  
  elements.forEach(element => {
    const score = scoreElementMatch(fingerprint, element);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = element;
    }
  });
  
  return bestScore >= threshold ? bestMatch : null;
}

function handleClick(e: MouseEvent) {
  if (!isPickerActive) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  selectedElement = e.target as HTMLElement;
  
  // Remove hover effect
  document.querySelectorAll('.ucolor-hover').forEach(el => 
    el.classList.remove('ucolor-hover')
  );
  
  // Get the current style and fingerprint
  const currentStyle = getCurrentElementStyle(selectedElement);
  const fingerprint = getElementFingerprint(selectedElement);
  
  // Send message to popup with element info and color
  chrome.runtime.sendMessage({
    type: 'ELEMENT_SELECTED',
    elementInfo: {
      fingerprint,
      tagName: selectedElement.tagName,
      path: getElementPath(selectedElement),
      currentColor: currentStyle.color,
      isGradient: currentStyle.isGradient
    }
  });
  
  deactivateElementPicker();
}

function getElementPath(element: HTMLElement): string {
  const path: string[] = [];
  let current: HTMLElement | null = element;
  
  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    if (current.id) {
      selector += '#' + current.id;
    } else if (current.className) {
      selector += '.' + current.className.split(' ')
        .filter(c => c !== 'ucolor-hover')
        .join('.');
    }
    path.unshift(selector);
    current = current.parentElement;
  }
  
  return path.join(' > ');
}

function activateElementPicker() {
  isPickerActive = true;
  document.body.style.cursor = 'crosshair';
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);
  document.addEventListener('click', handleClick);
}

function deactivateElementPicker() {
  isPickerActive = false;
  document.body.style.cursor = 'default';
  document.removeEventListener('mouseover', handleMouseOver);
  document.removeEventListener('mouseout', handleMouseOut);
  document.removeEventListener('click', handleClick);
}

// Get current URL without query parameters
const getCurrentUrl = () => window.location.origin + window.location.pathname;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'START_PICKING':
      activateElementPicker();
      sendResponse({ success: true });
      break;
      
    case 'APPLY_COLOR':
      if (selectedElement && message.color) {
        const color = message.isGradient ? 
          `linear-gradient(${message.color})` : 
          message.color;
        
        selectedElement.style.background = color;
        
        // Set persistence mode attribute
        selectedElement.setAttribute('data-ucolor-persistence', message.persistenceMode || 'standard');
        
        // Save the change with website URL
        chrome.storage.local.get('colorChanges', (result) => {
          const changes: StorageData = result.colorChanges || {};
          const url = getCurrentUrl();
          const urlChanges = changes[url] || [];
          
          // Get fingerprint with persistence mode
          const fingerprint = getElementFingerprint(selectedElement!);
          fingerprint.persistenceMode = message.persistenceMode || 'standard';
          
          // Add new change with fingerprint
          const newChange: ColorChange = {
            fingerprint,
            path: getElementPath(selectedElement!),
            color: message.color,
            elementTag: selectedElement!.tagName.toLowerCase(),
            timestamp: Date.now(),
            isGradient: message.isGradient
          };
          
          // Remove any existing change for this element
          const filteredChanges = urlChanges.filter(
            change => !isMatchingElement(selectedElement!, change.fingerprint)
          );
          
          changes[url] = [...filteredChanges, newChange];
          chrome.storage.local.set({ colorChanges: changes });
        });
        sendResponse({ success: true });
      }
      break;
      
    case 'GET_SELECTED_ELEMENT':
      if (selectedElement) {
        const currentStyle = getCurrentElementStyle(selectedElement);
        sendResponse({
          hasSelected: true,
          elementInfo: {
            tagName: selectedElement.tagName,
            path: getElementPath(selectedElement),
            currentColor: currentStyle.color,
            isGradient: currentStyle.isGradient
          }
        });
      } else {
        sendResponse({ hasSelected: false, elementInfo: null });
      }
      break;

    case 'GET_HISTORY':
      chrome.storage.local.get('colorChanges', (result) => {
        const changes: StorageData = result.colorChanges || {};
        const url = getCurrentUrl();
        sendResponse({ changes: changes[url] || [] });
      });
      break;

    case 'RESET_ELEMENT':
      if (message.fingerprint) {
        const element = findElementByFingerprint(message.fingerprint);
        if (element) {
          // Reset both background and backgroundColor to ensure gradient is cleared
          element.style.background = '';
          element.style.backgroundColor = '';
          
          // Remove from storage
          chrome.storage.local.get('colorChanges', (result) => {
            const changes: StorageData = result.colorChanges || {};
            const url = getCurrentUrl();
            const urlChanges = changes[url] || [];
            
            changes[url] = urlChanges.filter(
              change => !isMatchingElement(element, change.fingerprint)
            );
            
            chrome.storage.local.set({ colorChanges: changes });
          });
        }
        sendResponse({ success: true });
      }
      break;

    case 'RESET_ALL':
      chrome.storage.local.get('colorChanges', (result) => {
        const changes: StorageData = result.colorChanges || {};
        const url = getCurrentUrl();
        const urlChanges = changes[url] || [];
        
        // Reset all elements
        urlChanges.forEach(change => {
          const element = document.querySelector(change.path);
          if (element) {
            // Reset both background and backgroundColor to ensure gradient is cleared
            (element as HTMLElement).style.background = '';
            (element as HTMLElement).style.backgroundColor = '';
          }
        });
        
        // Clear storage for this URL
        delete changes[url];
        chrome.storage.local.set({ colorChanges: changes });
        sendResponse({ success: true });
      });
      break;
  }
  return true; // Keep the message channel open for async responses
});

// Update page load handler
chrome.storage.local.get('colorChanges', (result) => {
  const changes: StorageData = result.colorChanges || {};
  const url = getCurrentUrl();
  const urlChanges = changes[url] || [];
  
  urlChanges.forEach(change => {
    try {
      // Try to find element by fingerprint
      let element = findElementByFingerprint(change.fingerprint);
      
      // If not found, try the path as fallback
      if (!element) {
        element = document.querySelector(change.path);
      }
      
      if (element) {
        const color = change.isGradient ? 
          `linear-gradient(${change.color})` : 
          change.color;
        element.style.background = color;
      }
    } catch (e) {
      console.warn('Failed to apply color to element:', change.fingerprint.textContent);
    }
  });
});

// Update isMatchingElement to use persistence modes
function isMatchingElement(element: HTMLElement, fingerprint: ElementFingerprint): boolean {
  const threshold = PERSISTENCE_THRESHOLDS[fingerprint.persistenceMode || 'standard'];
  return scoreElementMatch(fingerprint, element) >= threshold;
} 