import bcrypt from "bcrypt";

/**
 * Password utility functions for handling bcrypt operations
 * Handles both PHP ($2y$) and Node.js ($2b$) hash formats
 */
export class PasswordUtils {
  /**
   * Compare a plain text password with a hash
   * Handles both PHP and Node.js bcrypt formats
   */
  static async comparePassword(plainPassword: string, hash: string): Promise<boolean> {
    try {
      // First try with the original hash
      let result = await bcrypt.compare(plainPassword, hash);
      
      // If it fails and the hash is PHP format ($2y$), try converting to Node.js format ($2b$)
      if (!result && hash.startsWith('$2y$')) {
        const convertedHash = hash.replace(/^\$2y\$/, '$2b$');
        result = await bcrypt.compare(plainPassword, convertedHash);
      }
      
      return result;
    } catch (error) {
      console.error('Error comparing password:', error);
      return false;
    }
  }

  /**
   * Synchronous version of password comparison
   */
  static comparePasswordSync(plainPassword: string, hash: string): boolean {
    try {
      // First try with the original hash
      let result = bcrypt.compareSync(plainPassword, hash);
      
      // If it fails and the hash is PHP format ($2y$), try converting to Node.js format ($2b$)
      if (!result && hash.startsWith('$2y$')) {
        const convertedHash = hash.replace(/^\$2y\$/, '$2b$');
        result = bcrypt.compareSync(plainPassword, convertedHash);
      }
      
      return result;
    } catch (error) {
      console.error('Error comparing password:', error);
      return false;
    }
  }

  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(plainPassword: string, saltRounds: number = 10): Promise<string> {
    return bcrypt.hash(plainPassword, saltRounds);
  }

  /**
   * Test if a hash is a PHP bcrypt format
   */
  static isPhpBcryptHash(hash: string): boolean {
    return hash.startsWith('$2y$');
  }

  /**
   * Convert PHP bcrypt hash to Node.js format
   */
  static convertPhpHashToNodeJs(hash: string): string {
    return hash.replace(/^\$2y\$/, '$2b$');
  }
}

export default PasswordUtils;