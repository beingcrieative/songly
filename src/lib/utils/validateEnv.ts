/**
 * Environment variable validation for production deployments
 * Ensures all required variables are set before the app starts
 */

export type EnvValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

/**
 * Validates required environment variables for production
 */
export function validateEnv(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Critical variables (app won't work without these)
  const required = {
    // InstantDB
    NEXT_PUBLIC_INSTANT_APP_ID: process.env.NEXT_PUBLIC_INSTANT_APP_ID,
    INSTANT_APP_ADMIN_TOKEN: process.env.INSTANT_APP_ADMIN_TOKEN,

    // Suno API
    SUNO_API_KEY: process.env.SUNO_API_KEY,
  };

  // Check required variables
  for (const [key, value] of Object.entries(required)) {
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${key}`);
    }
  }

  // Recommended variables (app works but with degraded functionality)
  const recommended = {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    SUNO_CALLBACK_URL: process.env.SUNO_CALLBACK_URL,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  };

  for (const [key, value] of Object.entries(recommended)) {
    if (!value || value.trim() === '') {
      // Special handling for callback URLs on Vercel
      if ((key === 'SUNO_CALLBACK_URL' || key === 'NEXT_PUBLIC_BASE_URL') && process.env.VERCEL_URL) {
        warnings.push(`${key} not set, but will auto-detect from VERCEL_URL: ${process.env.VERCEL_URL}`);
      } else {
        warnings.push(`Missing recommended environment variable: ${key}`);
      }
    }
  }

  // Validate URL formats
  if (process.env.SUNO_CALLBACK_URL) {
    try {
      new URL(process.env.SUNO_CALLBACK_URL);

      // Check for common mistakes
      if (process.env.SUNO_CALLBACK_URL.includes('ngrok') && process.env.NODE_ENV === 'production') {
        warnings.push('SUNO_CALLBACK_URL contains ngrok domain in production - this may not work');
      }
      if (process.env.SUNO_CALLBACK_URL.includes('localhost') && process.env.NODE_ENV === 'production') {
        errors.push('SUNO_CALLBACK_URL points to localhost in production - callbacks will fail');
      }
      if (process.env.SUNO_CALLBACK_URL.startsWith('http://') && process.env.NODE_ENV === 'production') {
        warnings.push('SUNO_CALLBACK_URL uses http:// instead of https:// - this may cause issues');
      }
    } catch (e) {
      errors.push(`SUNO_CALLBACK_URL is not a valid URL: ${process.env.SUNO_CALLBACK_URL}`);
    }
  }

  if (process.env.NEXT_PUBLIC_BASE_URL) {
    try {
      new URL(process.env.NEXT_PUBLIC_BASE_URL);

      if (process.env.NEXT_PUBLIC_BASE_URL.includes('localhost') && process.env.NODE_ENV === 'production') {
        warnings.push('NEXT_PUBLIC_BASE_URL points to localhost in production');
      }
    } catch (e) {
      errors.push(`NEXT_PUBLIC_BASE_URL is not a valid URL: ${process.env.NEXT_PUBLIC_BASE_URL}`);
    }
  }

  // Check for placeholder values
  const placeholderValues = ['TEMP', 'PLACEHOLDER', 'your-', 'xxx', 'changeme'];
  for (const [key, value] of Object.entries({ ...required, ...recommended })) {
    if (value && placeholderValues.some(ph => value.toLowerCase().includes(ph.toLowerCase()))) {
      errors.push(`${key} contains placeholder value - please update with real value: ${value}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Logs validation results to console
 * Useful for debugging deployment issues
 */
export function logEnvValidation(): void {
  const result = validateEnv();

  if (result.errors.length > 0) {
    console.error('❌ Environment validation errors:');
    result.errors.forEach(error => console.error(`  - ${error}`));
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment validation warnings:');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  if (result.valid && result.warnings.length === 0) {
    console.log('✅ All environment variables validated successfully');
  }
}

/**
 * Throws an error if validation fails (strict mode for production)
 */
export function validateEnvStrict(): void {
  const result = validateEnv();

  if (!result.valid) {
    const message = [
      'Environment validation failed:',
      ...result.errors,
      '',
      'Please configure these environment variables in your Vercel dashboard:',
      'Settings → Environment Variables',
    ].join('\n');

    throw new Error(message);
  }

  // Log warnings even if valid
  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment validation warnings:');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
}
