import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_RECRUIT_LIST_COLUMN_IDS,
  RECRUIT_LIST_COLUMNS,
  type RecruitListColumnId,
} from '@countcard/core/utils/recruitListColumns';

const STORAGE_KEY = 'recruit-list-columns-v1';
const VIEW_MODE_KEY = 'recruit-list-view-mode-v1';

export type RecruitListViewStyle = 'list' | 'grid';

function columnOrderIndex(id: RecruitListColumnId): number {
  return RECRUIT_LIST_COLUMNS.findIndex((column) => column.id === id);
}

function sanitizeColumnIds(ids: string[]): RecruitListColumnId[] {
  const allowed = new Set(RECRUIT_LIST_COLUMNS.map((column) => column.id));
  const cleaned = ids.filter((id): id is RecruitListColumnId => allowed.has(id as RecruitListColumnId));
  if (cleaned.length === 0) return [...DEFAULT_RECRUIT_LIST_COLUMN_IDS];

  const result = [...cleaned];
  for (const column of RECRUIT_LIST_COLUMNS) {
    if (!column.defaultVisible || result.includes(column.id)) continue;
    const targetIndex = columnOrderIndex(column.id);
    let insertAt = result.length;
    for (let i = 0; i < result.length; i += 1) {
      if (columnOrderIndex(result[i]) > targetIndex) {
        insertAt = i;
        break;
      }
    }
    result.splice(insertAt, 0, column.id);
  }
  return result;
}

export function useRecruitListColumns() {
  const [visibleColumnIds, setVisibleColumnIds] = useState<RecruitListColumnId[]>(
    DEFAULT_RECRUIT_LIST_COLUMN_IDS
  );
  const [viewStyle, setViewStyle] = useState<RecruitListViewStyle>('grid');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [storedColumns, storedView] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(VIEW_MODE_KEY),
        ]);
        if (cancelled) return;
        if (storedColumns) {
          const parsed = JSON.parse(storedColumns) as string[];
          setVisibleColumnIds(sanitizeColumnIds(parsed));
        }
        if (storedView === 'list' || storedView === 'grid') {
          setViewStyle(storedView);
        }
      } catch {
        // keep defaults
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistColumns = useCallback(async (ids: RecruitListColumnId[]) => {
    const next = sanitizeColumnIds(ids);
    setVisibleColumnIds(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const persistViewStyle = useCallback(async (style: RecruitListViewStyle) => {
    setViewStyle(style);
    await AsyncStorage.setItem(VIEW_MODE_KEY, style);
  }, []);

  const toggleColumn = useCallback(
    async (columnId: RecruitListColumnId) => {
      const next = visibleColumnIds.includes(columnId)
        ? visibleColumnIds.filter((id) => id !== columnId)
        : [...visibleColumnIds, columnId];
      await persistColumns(next);
    },
    [persistColumns, visibleColumnIds]
  );

  return {
    ready,
    visibleColumnIds,
    viewStyle,
    setVisibleColumnIds: persistColumns,
    setViewStyle: persistViewStyle,
    toggleColumn,
  };
}
