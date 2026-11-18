// Field names and visitor messages of the optional complaint photo or document, shared by the server
// (complaint-file.ts) and the browser (attachment.tsx). No Node or React imports.

/** The form field names: the file itself, and what the browser sends after its own upload. */
export const ATTACHMENT_FIELD = "attachment";
export const ATTACHMENT_PATH_FIELD = "attachment_path";
export const ATTACHMENT_NAME_FIELD = "attachment_name";

/** What the file input accepts. */
export const ATTACHMENT_ACCEPT = ".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf";
export const ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;

export const ATTACHMENT_MESSAGES = {
  type: "Please choose a JPG, PNG or PDF file.",
  size: "The file must be 5 MB or smaller.",
  content: "This file does not look like a JPG, PNG or PDF. Please choose it again.",
  upload: "Your file could not be uploaded. Please try again, or send the form without it.",
  limited: "Too many files have been sent from your connection. Please try again later, or send the form without a file.",
  unavailable: "Adding a file is not available right now. Please send the form without it.",
} as const;
