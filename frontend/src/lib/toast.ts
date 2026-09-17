import { toast as sonnerToast } from "sonner";

/** Toast thống nhất cho app */
export const toast = {
  success: (message: string, description?: string) =>
    sonnerToast.success(message, description ? { description } : undefined),
  error: (message: string, description?: string) =>
    sonnerToast.error(message, description ? { description } : undefined),
  info: (message: string, description?: string) =>
    sonnerToast.message(message, description ? { description } : undefined),
  warning: (message: string, description?: string) =>
    sonnerToast.warning(message, description ? { description } : undefined),
};
