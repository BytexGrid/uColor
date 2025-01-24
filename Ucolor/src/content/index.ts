// Add debounce function at the top
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

let selectedElement: HTMLElement | null = null;
let isPickerActive = false;

// Add mutation observer
let mutationObserver: MutationObserver | null = null;

// Add styles for highlighted elements
const style = document.createElement('style');
style.textContent = `
  .ucolor-hover {
    outline: 2px dashed #4CAF50 !important;
    outline-offset: 2px !important;
  }
  .ucolor-selected {
    outline: 3px solid #2196F3 !important;
  }
`;
document.head.appendChild(style);

// Add color conversion utilities at the top
function rgbToHex(color: string): string {
  // Handle rgb/rgba format
  const rgb = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgb) {
    const r = parseInt(rgb[1]);
    const g = parseInt(rgb[2]);
    const b = parseInt(rgb[3]);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  // If it's already hex or another format, return as is
  return color;
}

function standardizeColor(color: string): string {
  if (color.startsWith('rgb')) {
    return rgbToHex(color);
  }
  // If it's already hex or another format, return as is
  return color;
}

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
      // Convert colors to hex format
      const hexColor1 = standardizeColor(color1.trim());
      const hexColor2 = standardizeColor(color2.trim());
      // Return in a consistent format
      return { 
        color: `linear-gradient(${angle ? angle : '90deg'}, ${hexColor1}, ${hexColor2})`,
        isGradient: true 
      };
    }
  }
  
  // Return solid color in hex format
  return { color: standardizeColor(backgroundColor), isGradient: false };
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

// Add scoring thresholds
const PERSISTENCE_THRESHOLDS: Record<PersistenceMode, number> = {
  stable: 70,
  standard: 40,
  experimental: 25,
  aggressive: 15
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

// Update scoreElementMatch to include new scoring criteria for aggressive mode
function scoreElementMatch(fingerprint: ElementFingerprint, element: HTMLElement): number {
  let score = 0;
  const elementFingerprint = getElementFingerprint(element);
  
  // Perfect text content match (40 points)
  if (fingerprint.textContent && fingerprint.textContent === elementFingerprint.textContent) {
    score += 40;
  } 
  // Partial text content match (20 points)
  else if (fingerprint.textContent && elementFingerprint.textContent.includes(fingerprint.textContent)) {
    score += 20;
  }
  // Structural text match for aggressive mode (10 points)
  else if (fingerprint.textContent && 
           elementFingerprint.textContent.length > 0 && 
           (fingerprint.persistenceMode === 'aggressive' || fingerprint.persistenceMode === 'experimental')) {
    score += 10;
  }
  
  // Tag name match (15 points)
  if (fingerprint.tagName === elementFingerprint.tagName) {
    score += 15;
  }
  
  // Attributes match (15 points total)
  if (fingerprint.href && fingerprint.href === elementFingerprint.href) score += 5;
  if (fingerprint.src && fingerprint.src === elementFingerprint.src) score += 5;
  if (fingerprint.alt && fingerprint.alt === elementFingerprint.alt) score += 2;
  if (fingerprint.ariaLabel && fingerprint.ariaLabel === elementFingerprint.ariaLabel) score += 3;
  
  // Similar dimensions (10 points)
  const dimensionDiff = Math.abs(fingerprint.dimensions.width - elementFingerprint.dimensions.width) +
                       Math.abs(fingerprint.dimensions.height - elementFingerprint.dimensions.height);
  if (dimensionDiff < 5) score += 10;
  else if (dimensionDiff < 20) score += 5;
  // Looser dimension matching for experimental/aggressive modes
  else if (dimensionDiff < 50 && 
           (fingerprint.persistenceMode === 'aggressive' || fingerprint.persistenceMode === 'experimental')) {
    score += 3;
  }
  
  // Parent text match (10 points)
  if (fingerprint.parentText && fingerprint.parentText === elementFingerprint.parentText) {
    score += 10;
  }
  // Partial parent text match for experimental/aggressive modes
  else if (fingerprint.parentText && 
           elementFingerprint.parentText.includes(fingerprint.parentText) &&
           (fingerprint.persistenceMode === 'aggressive' || fingerprint.persistenceMode === 'experimental')) {
    score += 5;
  }
  
  // Class matches (10 points)
  const commonClasses = fingerprint.classes.filter(c => elementFingerprint.classes.includes(c));
  const classScore = Math.min(10, commonClasses.length * 2);
  score += classScore;
  
  // For aggressive mode, give bonus points for partial class matches
  if (fingerprint.persistenceMode === 'aggressive' && fingerprint.classes.length > 0) {
    const partialClassMatches = fingerprint.classes.filter(c => 
      elementFingerprint.classes.some(ec => ec.includes(c) || c.includes(ec))
    );
    score += Math.min(5, partialClassMatches.length);
  }
  
  // Add enhanced scoring for aggressive mode only
  if (fingerprint.persistenceMode === 'aggressive') {
    // Viewport position scoring (10 points)
    if (fingerprint.viewportPosition && elementFingerprint.viewportPosition) {
      const vpf = fingerprint.viewportPosition;
      const vpe = elementFingerprint.viewportPosition;
      
      if (Math.abs(vpf.relativePosition.fromTop - vpe.relativePosition.fromTop) < 0.3 &&
          Math.abs(vpf.relativePosition.fromLeft - vpe.relativePosition.fromLeft) < 0.3) {
        score += 10;
      }
    }

    // Visual characteristics scoring (10 points)
    if (fingerprint.visualCharacteristics && elementFingerprint.visualCharacteristics) {
      const vcf = fingerprint.visualCharacteristics;
      const vce = elementFingerprint.visualCharacteristics;
      
      if (vcf.fontSize === vce.fontSize) score += 2;
      if (vcf.textAlign === vce.textAlign) score += 2;
      if (vcf.display === vce.display) score += 2;
      if (vcf.isVisible === vce.isVisible) score += 4;
    }

    // Element structure scoring (10 points)
    if (fingerprint.elementStructure && elementFingerprint.elementStructure) {
      const esf = fingerprint.elementStructure;
      const ese = elementFingerprint.elementStructure;
      
      // Similar position among siblings (5 points)
      if (Math.abs(esf.relativePositionInParent - ese.relativePositionInParent) < 0.2) {
        score += 5;
      }

      // Semantic section matching (5 points)
      if ((esf.inHeader && ese.inHeader) ||
          (esf.inFooter && ese.inFooter) ||
          (esf.inNav && ese.inNav) ||
          (esf.inMain && ese.inMain) ||
          (esf.inAside && ese.inAside)) {
        score += 5;
      }
    }

    // DOM tree context scoring (10 points)
    if (fingerprint.domTreeContext && elementFingerprint.domTreeContext) {
      const dtc = fingerprint.domTreeContext;
      const etc = elementFingerprint.domTreeContext;
      
      if (dtc.depthFromRoot === etc.depthFromRoot) score += 2;
      if (dtc.siblingCount === etc.siblingCount) score += 2;
      if (dtc.similarSiblingsCount === etc.similarSiblingsCount) score += 2;
      if (dtc.nearestLandmarks.header === etc.nearestLandmarks.header) score += 2;
      if (dtc.nearestLandmarks.nav === etc.nearestLandmarks.nav) score += 2;
      if (dtc.nearestLandmarks.main === etc.nearestLandmarks.main) score += 2;
      if (dtc.nearestLandmarks.aside === etc.nearestLandmarks.aside) score += 2;
      if (dtc.nearestLandmarks.footer === etc.nearestLandmarks.footer) score += 2;
    }

    // Visual layout scoring (10 points)
    if (fingerprint.visualLayout && elementFingerprint.visualLayout) {
      const vlf = fingerprint.visualLayout;
      const vle = elementFingerprint.visualLayout;
      
      if (vlf.zIndex === vle.zIndex) score += 2;
      if (vlf.stackingContext === vle.stackingContext) score += 2;
      if (vlf.marginPattern === vle.marginPattern) score += 2;
      if (vlf.paddingPattern === vle.paddingPattern) score += 2;
      if (vlf.isInFlexContainer === vle.isInFlexContainer) score += 2;
      if (vlf.isInGridContainer === vle.isInGridContainer) score += 2;
      if (vlf.relativeSize.toParent === vle.relativeSize.toParent) score += 2;
      if (vlf.relativeSize.toViewport === vle.relativeSize.toViewport) score += 2;
    }

    // Enhanced characteristics scoring (10 points)
    if (fingerprint.enhancedCharacteristics && elementFingerprint.enhancedCharacteristics) {
      const ecf = fingerprint.enhancedCharacteristics;
      const ece = elementFingerprint.enhancedCharacteristics;
      
      if (ecf.computedStylesHash === ece.computedStylesHash) score += 2;
      if (ecf.hasEventListeners === ece.hasEventListeners) score += 2;
      if (ecf.ariaAttributes.size === ece.ariaAttributes.size) score += 2;
      if (ecf.dataAttributes.size === ece.dataAttributes.size) score += 2;
      if (ecf.interactiveType === ece.interactiveType) score += 2;
      if (ecf.isClickable === ece.isClickable) score += 2;
    }
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

// Debounced version of reapplyStyles
const debouncedReapplyStyles = debounce(reapplyStyles, 250);

// More selective mutation observer
function setupMutationObserver() {
  if (mutationObserver) mutationObserver.disconnect();

  mutationObserver = new MutationObserver((mutations) => {
    let shouldReapply = false;
    
    for (const mutation of mutations) {
      // Only care about style/class changes on elements with our UID
      if (mutation.type === 'attributes') {
        const target = mutation.target as HTMLElement;
        if (target.hasAttribute('data-ucolor-uid')) {
          shouldReapply = true;
          break;
        }
      }
      // Or new elements being added
      else if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        shouldReapply = true;
        break;
      }
    }

    if (shouldReapply) {
      debouncedReapplyStyles();
    }
  });

  // More specific attribute filtering
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class'] // Only watch style and class changes
  });
}

// Add reapplyStyles function
function reapplyStyles() {
  chrome.storage.local.get('colorChanges', (result) => {
    const changes: StorageData = result.colorChanges || {};
    const url = getCurrentUrl();
    const urlChanges = changes[url] || [];
    
    urlChanges.forEach(change => {
      try {
        const element = findElementByFingerprint(change.fingerprint);
        if (element) {
          const color = change.isGradient ? 
            `linear-gradient(${change.color})` : 
            change.color;
          element.style.background = color;
          
          // Add UID if missing
          if (!element.getAttribute('data-ucolor-uid')) {
            const uid = generateUniqueId();
            element.setAttribute('data-ucolor-uid', uid);
          }
        }
      } catch (error) {
        console.warn('Failed to reapply style:', error);
      }
    });
  });
}

// Update handleClick function
function handleClick(e: MouseEvent) {
  if (!isPickerActive) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  selectedElement = e.target as HTMLElement;
  
  // Remove hover effect
  document.querySelectorAll('.ucolor-hover').forEach(el => 
    el.classList.remove('ucolor-hover')
  );
  
  // Add selected class
  selectedElement.classList.add('ucolor-selected');
  
  // Get the current style and fingerprint
  const currentStyle = getCurrentElementStyle(selectedElement);
  const fingerprint = getElementFingerprint(selectedElement);
  
  // Ensure element has a UID
  if (!selectedElement.getAttribute('data-ucolor-uid')) {
    const uid = generateUniqueId();
    selectedElement.setAttribute('data-ucolor-uid', uid);
  }
  
  // Send message to popup with element info
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

// Add event listeners after function definitions
function activateElementPicker() {
  isPickerActive = true;
  document.body.style.cursor = 'crosshair';
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);
  document.addEventListener('click', handleClick);
  setupMutationObserver();
}

function deactivateElementPicker() {
  isPickerActive = false;
  document.body.style.cursor = 'default';
  document.removeEventListener('mouseover', handleMouseOver);
  document.removeEventListener('mouseout', handleMouseOut);
  document.removeEventListener('click', handleClick);
  if (mutationObserver) {
    mutationObserver.disconnect();
  }
  if (selectedElement) {
    selectedElement.classList.remove('ucolor-selected');
  }
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
        let color = message.color;
        if (!message.isGradient) {
          color = standardizeColor(message.color);
        } else {
          // For gradients, convert each color in the gradient
          const gradientMatch = color.match(/(.*?)((?:rgb\([^)]+\)|#[a-fA-F0-9]{6}|[a-zA-Z]+))(.*?)((?:rgb\([^)]+\)|#[a-fA-F0-9]{6}|[a-zA-Z]+))(.*)/);
          if (gradientMatch) {
            const [, start, color1, middle, color2, end] = gradientMatch;
            color = `${start}${standardizeColor(color1)}${middle}${standardizeColor(color2)}${end}`;
          }
        }
        
        selectedElement.style.background = message.isGradient ? 
          `linear-gradient(${color})` : 
          color;
        
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

// Initialize on page load
chrome.storage.local.get('colorChanges', (result) => {
  reapplyStyles();
  setupMutationObserver();
});

// Update isMatchingElement to use persistence modes
function isMatchingElement(element: HTMLElement, fingerprint: ElementFingerprint): boolean {
  const threshold = PERSISTENCE_THRESHOLDS[fingerprint.persistenceMode || 'standard'];
  return scoreElementMatch(fingerprint, element) >= threshold;
} 