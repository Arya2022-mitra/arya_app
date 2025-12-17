# Frontend Translation Guide

## Overview
This guide explains how to translate backend data on the frontend using MitraVeda's translation infrastructure. All translations happen client-side without touching the backend.

## Translation Service

The application provides a `GlobalTranslationProvider` that offers comprehensive translation capabilities through the `useTranslationService()` hook.

### Basic Usage

```typescript
import { useTranslationService } from '@/shared/translation/GlobalTranslationProvider';

function MyComponent() {
  const { translateText, translateJSON, locale, isTranslating } = useTranslationService();
  
  // Your component logic
}
```

## Available Translation Methods

### 1. `translateText` - Translate Simple Strings

Use this for translating individual text strings from backend responses.

```typescript
const { translateText, locale } = useTranslationService();

// Translate a string
const translatedText = await translateText("Hello, world!");

// With options
const translatedText = await translateText("Hello, world!", {
  src: 'en',           // Source language (default: 'en')
  locale: locale,      // Target language (uses current locale by default)
  tokenMap: 'planets'  // Optional token map for domain-specific terms
});
```

### 2. `translateJSON` - Translate Complex Objects

Use this for translating entire API response objects while preserving structure.

```typescript
const { translateJSON, locale } = useTranslationService();

// Translate an API response
const result = await translateJSON(apiResponse, {
  src: 'en',                    // Source language
  locale: locale,               // Target language
  tokenMap: ['planets', 'deities'],  // Multiple token maps
  whitelistKeys: ['description', 'title'],  // Only translate these keys
  blacklistKeys: ['id', 'timestamp'],       // Skip these keys
  skipDateLike: true,           // Skip date-like strings
  skipNumeric: true,            // Skip numeric strings
  forceRefresh: false           // Use cache if available
});

// The result contains:
// - data: The translated object
// - status: 'success' | 'fallback' | 'error'
// - cacheHit: boolean
```

## Translation Patterns

### Pattern 1: Translate API Response Data

```typescript
import { useEffect, useState } from 'react';
import { useTranslationService } from '@/shared/translation/GlobalTranslationProvider';

function DataDisplayComponent() {
  const [data, setData] = useState(null);
  const { translateJSON, locale, sequence } = useTranslationService();
  
  useEffect(() => {
    async function fetchAndTranslate() {
      // Fetch data from backend
      const response = await fetch('/api/v1/my-endpoint');
      const rawData = await response.json();
      
      // Translate the data
      const { data: translatedData } = await translateJSON(rawData, {
        locale: locale,
        whitelistKeys: ['description', 'message', 'title', 'content'],
        skipDateLike: true,
        skipNumeric: true
      });
      
      setData(translatedData);
    }
    
    fetchAndTranslate();
  }, [locale, sequence]); // Re-translate when language changes
  
  return <div>{/* Render translated data */}</div>;
}
```

### Pattern 2: Translate Specific Fields

```typescript
function ProfileComponent({ profile }) {
  const [translatedBio, setTranslatedBio] = useState(profile.bio);
  const { translateText, locale } = useTranslationService();
  
  useEffect(() => {
    async function translate() {
      const result = await translateText(profile.bio, { locale });
      setTranslatedBio(result.translated_text);
    }
    
    if (profile.bio && locale !== 'en') {
      translate();
    } else {
      setTranslatedBio(profile.bio);
    }
  }, [profile.bio, locale]);
  
  return (
    <div>
      <h2>{profile.name}</h2>
      <p>{translatedBio}</p>
    </div>
  );
}
```

### Pattern 3: Preload Translations

Preload translations for better performance:

```typescript
function OptimizedComponent() {
  const { preload, translateJSON, locale } = useTranslationService();
  
  useEffect(() => {
    async function prepareData() {
      const response = await fetch('/api/v1/data');
      const data = await response.json();
      
      // Preload translations in the background
      await preload(data, { 
        locale,
        whitelistKeys: ['description', 'content']
      });
    }
    
    prepareData();
  }, [locale]);
  
  // Later, when you need the translation, it will be cached
}
```

## Token Maps for Domain-Specific Terms

Token maps help maintain consistency for domain-specific terminology (e.g., planet names, deity names).

### Using Built-in Token Maps

```typescript
// Available built-in token maps:
// - 'planets': Planet names and astrological terms
// - 'deities': Deity names

const { translateJSON } = useTranslationService();

const result = await translateJSON(astroData, {
  tokenMap: ['planets', 'deities']
});
```

### Creating Custom Token Maps

```typescript
import { useTranslationService } from '@/shared/translation/GlobalTranslationProvider';

function ComponentWithCustomTokens() {
  const { registerTokenMap, translateJSON, locale } = useTranslationService();
  
  useEffect(() => {
    // Register custom domain-specific terms
    registerTokenMap('zodiac-signs', [
      { en: 'Aries', ta: 'மேஷம்', hi: 'मेष' },
      { en: 'Taurus', ta: 'ரிஷபம்', hi: 'वृषभ' },
      // ... more terms
    ]);
  }, []);
  
  // Use the custom token map
  const translate = async (data) => {
    return await translateJSON(data, {
      locale,
      tokenMap: 'zodiac-signs'
    });
  };
}
```

## Performance Considerations

1. **Caching**: Translations are automatically cached. Use `forceRefresh: true` only when necessary.

2. **Debouncing**: Language changes are debounced (350ms) to avoid excessive re-renders.

3. **Selective Translation**: Use `whitelistKeys` and `blacklistKeys` to translate only what's needed.

4. **Skip Unnecessary Fields**: 
   - Set `skipDateLike: true` to skip dates and timestamps
   - Set `skipNumeric: true` to skip numbers

## Translation Status

Monitor translation status in your UI:

```typescript
function ComponentWithLoadingState() {
  const { isTranslating } = useTranslationService();
  
  return (
    <div>
      {isTranslating && <LoadingSpinner />}
      {/* Your content */}
    </div>
  );
}
```

## Supported Languages

The following languages are supported with full transliteration:

- English (en)
- Hindi (hi) - हिन्दी
- Tamil (ta) - தமிழ்
- Telugu (te) - తెలుగు
- Malayalam (ml) - മലയാളം
- Kannada (kn) - ಕನ್ನಡ
- Bengali (bn) - বাংলা
- Marathi (mr) - मराठी
- Gujarati (gu) - ગુજરાતી
- Nepali (ne) - नेपाली
- Malay (ms) - Bahasa Melayu

## Best Practices

1. **Always Translate User-Facing Content**: Any text from the backend that users will read should be translated.

2. **Don't Translate Technical Fields**: IDs, timestamps, API keys, etc. should not be translated.

3. **Use Transliteration for UI Labels**: Important UI terms (Account, Settings, Profile, Email) use transliteration to maintain phonetic consistency across languages.

4. **Handle Fallbacks**: Always provide fallback content in case translation fails.

```typescript
const { translateText } = useTranslationService();

const text = await translateText(content).catch(() => ({
  translated_text: content,
  translation_status: 'fallback'
}));
```

5. **Re-translate on Language Change**: Watch `locale` and `sequence` from `useTranslationService()` to re-trigger translations when the user changes language.

## Example: Complete Implementation

```typescript
import { useEffect, useState } from 'react';
import { useTranslationService } from '@/shared/translation/GlobalTranslationProvider';
import { useAuth } from '@/lib/useAuth';

function AstrologyPrediction({ profileId }) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const { translateJSON, locale, sequence, isTranslating } = useTranslationService();
  
  useEffect(() => {
    async function loadPrediction() {
      setLoading(true);
      try {
        // Fetch from backend
        const response = await fetch(`/api/v1/predictions/${profileId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        
        // Translate the response
        const { data: translated } = await translateJSON(data, {
          locale,
          tokenMap: ['planets', 'deities'],
          whitelistKeys: [
            'summary', 'description', 'interpretation',
            'recommendations', 'warnings'
          ],
          skipDateLike: true,
          skipNumeric: true
        });
        
        setPrediction(translated);
      } catch (error) {
        console.error('Failed to load prediction:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (profileId && token) {
      loadPrediction();
    }
  }, [profileId, token, locale, sequence]);
  
  if (loading || isTranslating) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <h2>{prediction?.title}</h2>
      <p>{prediction?.summary}</p>
      {/* Render other fields */}
    </div>
  );
}

export default AstrologyPrediction;
```

## Troubleshooting

### Translation Not Working
- Check that the language code is in the supported list
- Verify that `GlobalTranslationProvider` wraps your app in `_app.tsx`
- Check browser console for errors

### Translations Not Updating on Language Change
- Make sure you're watching `locale` and `sequence` in your useEffect dependencies
- Verify that `useTranslationService()` is called in your component

### Performance Issues
- Use `whitelistKeys` to limit what gets translated
- Enable `skipDateLike` and `skipNumeric` options
- Consider using `preload()` for large datasets

## Additional Resources

- See `web/shared/translation/GlobalTranslationProvider.tsx` for implementation details
- Check `web/lib/language-client.ts` for low-level translation functions
- Example usage in `web/components/PanchangView.tsx`
