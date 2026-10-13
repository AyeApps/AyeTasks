import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function downloadImportTemplate(content: string, fileName: string, dialogTitle?: string): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available');
  }

  const file = new File(Paths.cache, fileName);

  if (file.exists) {
    file.delete();
  }

  file.write(content);

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle,
  });
}
