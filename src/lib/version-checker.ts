
'use server';
    
import packageJson from '../../package.json';

/**
 * Provides the current application version.
 * This is intended for safe, read-only feature detection or display.
 * It does not perform any automatic updates.
 */
export const AppVersion = packageJson.version;

/**
 * Checks if the current app version meets a minimum required version.
 * @param minVersion The minimum version string to check against (e.g., "0.3.0").
 * @returns True if the current version is greater than or equal to the minimum version.
 */
export function checkVersion(minVersion: string): boolean {
    const currentParts = AppVersion.split('.').map(Number);
    const minParts = minVersion.split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, minParts.length); i++) {
        const current = currentParts[i] || 0;
        const min = minParts[i] || 0;
        if (current > min) return true;
        if (current < min) return false;
    }

    return true; // Versions are identical
}
