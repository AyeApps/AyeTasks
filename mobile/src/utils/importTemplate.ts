import { formatDateISO } from './dateUtils';
import { translations, Language } from '../i18n/translations';
import { TASK_COLOR_PALETTE } from '../constants/theme';

export function getImportTemplate(language: Language): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(today.getDate() + 2);

  const todayStr = formatDateISO(today);
  const tomorrowStr = formatDateISO(tomorrow);
  const dayAfterStr = formatDateISO(dayAfter);

  const t = translations[language].importTasks.template;

  const template = {
    format: 'ayetasks.import',
    version: 1,
    source: 'manual',
    tasks: [
      {
        ref: t.refDesign,
        title: t.titleDesign,
        date: todayStr,
        type: 'task',
        description: t.descDesign,
        priority: 'high',
        estimatedMinutes: 90,
        dueDate: dayAfterStr,
        dueTime: '18:00',
        color: TASK_COLOR_PALETTE[1],
        comments: [t.commentDesign]
      },
      {
        ref: t.refEndpoint,
        title: t.titleEndpoint,
        date: tomorrowStr,
        status: 'in_progress',
        parent: t.refDesign
      },
      {
        title: t.titleDaily,
        date: tomorrowStr,
        type: 'event',
        startTime: '10:00',
        endTime: '10:15',
        location: t.locationDaily
      }
    ],
    connections: [
      {
        from: t.refDesign,
        to: t.refEndpoint,
        type: 'dependency',
        label: t.labelBlocks
      }
    ]
  };

  return JSON.stringify(template, null, 2);
}
