/**
 * @file HRTHIS_useComponentDisplayName.ts
 * @domain HRTHIS - Component Display Name Hook
 * @description Automatically generates UI-friendly display names from component function names
 * @version v4.10.21 - UI Title / Code Name Alignment System
 * 
 * @example
 * ```tsx
 * function MyRequestsCalendar() {
 *   const displayName = useComponentDisplayName(MyRequestsCalendar);
 *   // Returns: "Meine Anträge (Kalender)"
 *   return <CardTitle>{displayName}</CardTitle>
 * }
 * ```
 * 
 * @naming_convention
 * Component names should follow the pattern:
 * - MyRequests[Feature] → "Meine Anträge ([Feature])"
 * - Admin[Feature]Overview → "Admin [Feature] (Übersicht)"
 * - [Feature]Management → "[Feature] Verwaltung"
 * 
 * Custom mappings can be added to DISPLAY_NAME_MAPPINGS below.
 */

/**
 * Mapping table for component names to display names
 * Add custom mappings here for specific components
 */
const DISPLAY_NAME_MAPPINGS: Record<string, string> = {
  // Meine Anträge Section
  'MyRequestsCalendar': 'Meine Anträge (Kalender)',
  'MyRequestsOverview': 'Meine Anträge (Übersicht)',
  
  // Admin Sections
  'AdminEmployeesList': 'Mitarbeiter (Übersicht)',
  'AdminTeamsList': 'Teams (Übersicht)',
  'AdminBenefitsList': 'Benefits (Übersicht)',
  
  // Add more custom mappings as needed
};

/**
 * Pattern-based transformations for common naming patterns
 */
const PATTERN_TRANSFORMATIONS = [
  {
    // MyRequests[Feature] → Meine Anträge ([Feature])
    pattern: /^MyRequests(.+)$/,
    transform: (match: RegExpMatchArray) => {
      const feature = match[1];
      const featureDE = translateFeature(feature);
      return `Meine Anträge (${featureDE})`;
    }
  },
  {
    // Admin[Feature]Overview → Admin [Feature] (Übersicht)
    pattern: /^Admin(.+)Overview$/,
    transform: (match: RegExpMatchArray) => {
      const feature = match[1];
      const featureDE = translateFeature(feature);
      return `Admin ${featureDE} (Übersicht)`;
    }
  },
  {
    // [Feature]Management → [Feature] Verwaltung
    pattern: /^(.+)Management$/,
    transform: (match: RegExpMatchArray) => {
      const feature = match[1];
      const featureDE = translateFeature(feature);
      return `${featureDE} Verwaltung`;
    }
  },
  {
    // [Feature]Details → [Feature] Details
    pattern: /^(.+)Details$/,
    transform: (match: RegExpMatchArray) => {
      const feature = match[1];
      const featureDE = translateFeature(feature);
      return `${featureDE} Details`;
    }
  },
  {
    // [Feature]List → [Feature] Liste
    pattern: /^(.+)List$/,
    transform: (match: RegExpMatchArray) => {
      const feature = match[1];
      const featureDE = translateFeature(feature);
      return `${featureDE} Liste`;
    }
  },
];

/**
 * Common English → German translations for feature names
 */
const FEATURE_TRANSLATIONS: Record<string, string> = {
  // Common Features
  'Calendar': 'Kalender',
  'Overview': 'Übersicht',
  'List': 'Liste',
  'Details': 'Details',
  'Management': 'Verwaltung',
  'Settings': 'Einstellungen',
  
  // Domain-specific
  'Requests': 'Anträge',
  'Employees': 'Mitarbeiter',
  'Teams': 'Teams',
  'Benefits': 'Benefits',
  'Learning': 'Lernen',
  'Documents': 'Dokumente',
  'Achievements': 'Erfolge',
  'Shop': 'Shop',
  'Coin': 'Münzen',
  'Avatar': 'Avatar',
  'Organigram': 'Organigramm',
  'Vehicle': 'Fahrzeug',
  'Equipment': 'Equipment',
  'Field': 'Feld',
  
  // Add more translations as needed
};

/**
 * Translates an English feature name to German
 * Falls back to the original if no translation exists
 */
function translateFeature(feature: string): string {
  // Try direct translation first
  if (FEATURE_TRANSLATIONS[feature]) {
    return FEATURE_TRANSLATIONS[feature];
  }
  
  // Try to split camelCase and translate parts
  const parts = feature.split(/(?=[A-Z])/);
  const translatedParts = parts.map(part => 
    FEATURE_TRANSLATIONS[part] || part
  );
  
  return translatedParts.join(' ');
}

/**
 * Extracts the display name from a component function
 * Supports both named and default exports
 */
function getComponentName(component: Function): string {
  // Try .name property first (works for named functions)
  if (component.name) {
    return component.name;
  }
  
  // Fallback: Try to extract from toString()
  const funcStr = component.toString();
  const nameMatch = funcStr.match(/^function\s+([^\s(]+)/);
  if (nameMatch) {
    return nameMatch[1];
  }
  
  // Last resort: return 'Component'
  return 'Component';
}

/**
 * Main hook: Automatically generates display name from component function
 * 
 * @param component - The component function (pass the function itself, not a string)
 * @returns Human-readable display name in German
 * 
 * @example
 * ```tsx
 * function MyRequestsCalendar() {
 *   const displayName = useComponentDisplayName(MyRequestsCalendar);
 *   return <CardTitle>{displayName}</CardTitle>
 * }
 * ```
 */
export function useComponentDisplayName(component: Function): string {
  const componentName = getComponentName(component);
  
  // 1. Check custom mappings first
  if (DISPLAY_NAME_MAPPINGS[componentName]) {
    return DISPLAY_NAME_MAPPINGS[componentName];
  }
  
  // 2. Try pattern-based transformations
  for (const { pattern, transform } of PATTERN_TRANSFORMATIONS) {
    const match = componentName.match(pattern);
    if (match) {
      return transform(match);
    }
  }
  
  // 3. Fallback: Split camelCase and translate
  const parts = componentName.split(/(?=[A-Z])/);
  const translatedParts = parts.map(part => translateFeature(part));
  return translatedParts.join(' ');
}

/**
 * Helper: Validates that a component name follows naming conventions
 * Useful for development/linting
 * 
 * @param component - The component function
 * @returns Object with validation result and suggestions
 */
export function validateComponentNaming(component: Function): {
  isValid: boolean;
  name: string;
  displayName: string;
  suggestions?: string[];
} {
  const name = getComponentName(component);
  const displayName = useComponentDisplayName(component);
  
  const suggestions: string[] = [];
  
  // Check if has custom mapping
  const hasCustomMapping = !!DISPLAY_NAME_MAPPINGS[name];
  
  // Check if matches pattern
  const matchesPattern = PATTERN_TRANSFORMATIONS.some(({ pattern }) => 
    pattern.test(name)
  );
  
  // Suggest adding to custom mappings if no pattern match
  if (!hasCustomMapping && !matchesPattern) {
    suggestions.push(
      `Consider adding to DISPLAY_NAME_MAPPINGS: '${name}': 'Your German Title'`
    );
  }
  
  // Check for HRTHIS_ prefix (optional)
  if (!name.startsWith('HRTHIS_') && !name.startsWith('My') && !name.startsWith('Admin')) {
    suggestions.push(
      `Consider prefixing with 'HRTHIS_' for internal components: HRTHIS_${name}`
    );
  }
  
  return {
    isValid: hasCustomMapping || matchesPattern,
    name,
    displayName,
    suggestions: suggestions.length > 0 ? suggestions : undefined
  };
}

/**
 * Development helper: Log all component name transformations
 * Use this to debug/verify component naming
 */
export function debugComponentNaming(components: Function[]): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.group('🔍 Component Naming Debug');
  components.forEach(component => {
    const validation = validateComponentNaming(component);
    console.log(`
      Component: ${validation.name}
      Display Name: ${validation.displayName}
      Valid: ${validation.isValid ? '✅' : '⚠️'}
      ${validation.suggestions ? `Suggestions:\n      - ${validation.suggestions.join('\n      - ')}` : ''}
    `);
  });
  console.groupEnd();
}
