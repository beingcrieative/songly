import { toast } from 'sonner';

export function showToast({
  title,
  description,
  variant = 'default',
}: {
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error';
}) {
  const message = description
    ? `${title}\n${description}`
    : title;

  switch (variant) {
    case 'success':
      return toast.success(message);
    case 'error':
      return toast.error(message);
    default:
      return toast(message);
  }
}

export { toast };
