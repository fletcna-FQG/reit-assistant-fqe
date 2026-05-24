import { Platform } from 'react-native';

export type PickedFile = {
  name: string;
  type: string;
  size: string;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extensionFromName(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : 'file';
}

/** Open a file picker on web; on native returns null until document picker is configured. */
export async function pickDocuments(): Promise<PickedFile[]> {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = '.pdf,.xlsx,.xls,.doc,.docx,.csv,.zip,.png,.jpg,.jpeg';
      input.onchange = () => {
        const files = Array.from(input.files ?? []);
        resolve(
          files.map((file) => ({
            name: file.name,
            type: extensionFromName(file.name),
            size: formatFileSize(file.size),
          })),
        );
      };
      input.click();
    });
  }

  return [];
}

/** Simulated import from connected integrations (ATTOM, MLS, etc.). */
export function integrationImportPlaceholder(source: string): PickedFile {
  const stamp = new Date().toISOString().slice(0, 10);
  return {
    name: `${source} Export ${stamp}.pdf`,
    type: 'pdf',
    size: '1.2 MB',
  };
}
