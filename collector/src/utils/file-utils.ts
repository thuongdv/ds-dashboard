import * as fs from "node:fs";

/**
 * File Utilities
 *
 * @class FileUtils
 * @description
 * A utility class providing static methods for common file operations including
 * reading, writing, and checking file existence. All methods are asynchronous
 * and use Node.js fs.promises API for non-blocking I/O operations.
 *
 * @example
 * ```typescript
 * // Check if file exists
 * const exists = await FileUtils.isFileExists('/path/to/file.txt');
 *
 * // Read file lines
 * const lines = await FileUtils.readLines('/path/to/file.txt');
 *
 * // Append to first line
 * await FileUtils.appendToFirstLine('/path/to/file.txt', 'new content');
 *
 * // Check if file contains text
 * const contains = await FileUtils.doesFileContain('/path/to/file.txt', 'search-text');
 * ```
 */
export default class FileUtils {
  /**
   * Reads a file and returns its content as an array of lines.
   *
   * @static
   * @async
   * @method readLines
   * @param {string} filePath - Absolute or relative path to the text file
   * @returns {Promise<string[]>} Array where each element is a line from the file
   * @throws {Error} When the file cannot be read or doesn't exist
   *
   * @example
   * ```typescript
   * const lines = await FileUtils.readLines('./logs/status.txt');
   * lines.forEach((line, index) => {
   *   console.log(`Line ${index + 1}: ${line}`);
   * });
   * ```
   */
  static async readLines(filePath: string): Promise<string[]> {
    try {
      const data = await fs.promises.readFile(filePath, "utf8");
      return data.split("\n");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Failed to read file lines: ${errorMessage}`);
    }
  }

  /**
   * Appends content to the first line of a text file.
   *
   * @static
   * @async
   * @method appendToFirstLine
   * @param {string} filePath - Path to the text file
   * @param {string} content - Content to append to the first line
   * @returns {Promise<void>}
   * @throws {Error} When the file cannot be read or written
   *
   * @description
   * If the file is empty, creates it with the provided content.
   * Otherwise, appends the content to the first line with a newline separator.
   * This is useful for prepending data to log files or status trackers.
   *
   * @example
   * ```typescript
   * // File contains: "existing content"
   * await FileUtils.appendToFirstLine('./status.txt', 'queue-12345');
   * // File now contains: "existing content\nqueue-12345"
   *
   * // Empty file
   * await FileUtils.appendToFirstLine('./empty.txt', 'first entry');
   * // File now contains: "first entry"
   * ```
   */
  static async appendToFirstLine(filePath: string, content: string): Promise<void> {
    try {
      // Read the entire file
      const data = await fs.promises.readFile(filePath, "utf8");

      // Split the content into lines
      const lines = data.split("\n");

      if (lines.length === 0) {
        // If file is empty, just write the content
        await fs.promises.writeFile(filePath, content);
        return;
      }

      // Append the content to the first line with a newline character
      lines[0] = lines[0] + "\n" + content;

      // Join the lines back together
      const newContent = lines.join("\n");

      // Write the modified content back to the file
      await fs.promises.writeFile(filePath, newContent);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Failed to append content to first line: ${errorMessage}`);
    }
  }

  /**
   * Appends a string as a new line to the end of a text file.
   *
   * @static
   * @async
   * @method appendLine
   * @param {string} filePath - Path to the text file
   * @param {string} content - Content to append as a new line
   * @returns {Promise<void>}
   * @throws {Error} When the file cannot be written to
   *
   * @example
   * ```typescript
   * await FileUtils.appendLine('./logs/activity.log', 'Process completed at ' + new Date());
   * await FileUtils.appendLine('./logs/activity.log', 'Next task started');
   * ```
   */
  static async appendLine(filePath: string, content: string): Promise<void> {
    try {
      await fs.promises.appendFile(filePath, `\n${content}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Failed to append line to file: ${errorMessage}`);
    }
  }

  /**
   * Checks if a file contains a specific string in any of its lines.
   *
   * @static
   * @async
   * @method doesFileContain
   * @param {string} filePath - Path to the text file
   * @param {string} searchString - String to search for (uses includes, not exact match)
   * @returns {Promise<boolean>} True if the string is found, false otherwise
   *
   * @description
   * Returns false if the file doesn't exist. Performs a case-sensitive search
   * across all lines of the file. Returns true on first match.
   *
   * @example
   * ```typescript
   * // Check if queue ID has been processed
   * const alreadyProcessed = await FileUtils.doesFileContain(
   *   './status.txt',
   *   'queue-12345'
   * );
   *
   * if (!alreadyProcessed) {
   *   // Process the queue
   * }
   * ```
   */
  static async doesFileContain(filePath: string, searchString: string): Promise<boolean> {
    if (!(await FileUtils.isFileExists(filePath))) {
      return false;
    }

    return await FileUtils.readLines(filePath)
      .then((lines) => {
        return lines.some((line) => line.includes(searchString));
      })
      .catch((error) => {
        console.error("Error reading file:", error);
        return false;
      });
  }

  /**
   * Checks if a file exists at the specified path.
   *
   * @static
   * @async
   * @method isFileExists
   * @param {string} filePath - Path to the file
   * @returns {Promise<boolean>} True if file exists, false otherwise
   *
   * @example
   * ```typescript
   * if (await FileUtils.isFileExists('./config.json')) {
   *   const lines = await FileUtils.readLines('./config.json');
   * } else {
   *   console.log('Config file not found');
   * }
   * ```
   */
  static async isFileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Downloads an image from a URL and saves it to the specified file path.
   *
   * @static
   * @async
   * @method downloadImage
   * @param {string} imageUrl - The URL of the image to download
   * @param {string} outputPath - The local file path where the image should be saved
   * @returns {Promise<void>}
   * @throws {Error} When the download fails or file cannot be written
   *
   * @description
   * Uses axios to download images from remote URLs with automatic redirect handling.
   * Automatically creates parent directories if they don't exist.
   * Supports both HTTP and HTTPS protocols with up to 5 redirects.
   *
   * @example
   * ```typescript
   * await FileUtils.downloadImage(
   *   'https://example.com/screenshot.png',
   *   './screenshots/test-failure-123.png'
   * );
   * ```
   */
  static async downloadImage(imageUrl: string, outputPath: string): Promise<void> {
    const axios = (await import("axios")).default;
    const path = await import("node:path");

    // Create directory if it doesn't exist
    const directory = path.dirname(outputPath);
    await fs.promises.mkdir(directory, { recursive: true });

    // Validate URL
    let urlObj: URL;
    try {
      urlObj = new URL(imageUrl);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid image URL: ${imageUrl} - ${errorMessage}`);
    }

    // Check protocol
    if (urlObj.protocol !== "https:" && urlObj.protocol !== "http:") {
      throw new Error(`Unsupported protocol "${urlObj.protocol}" in image URL: ${imageUrl}`);
    }

    // Download and write file
    try {
      // Download image using axios (which handles redirects automatically)
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        maxRedirects: 5, // Follow up to 5 redirects
        validateStatus: (status) => status >= 200 && status < 300, // Accept only successful status codes
      });

      // Write to file
      await fs.promises.writeFile(outputPath, response.data);
    } catch (error: unknown) {
      // Clean up partial file only if write started
      try {
        await fs.promises.unlink(outputPath);
      } catch {
        // Ignore errors during cleanup (file may not exist)
      }

      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Failed to download image: ${errorMessage}`);
    }
  }
}
