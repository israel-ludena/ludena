import { convert } from "html-to-text";

/**
 * Converts an HTML string to plain text, limiting the output to 140 characters.
 *
 * @param html - The HTML string to be converted to plain text.
 * @returns A plain text representation of the HTML, limited to 140 characters.
 */
export const htmlToTextForDescription = (html: string) => {
  return convert(html, {
    limits: {
      maxInputLength: 140,
    },
  });
};
