import { create } from 'zustand';
import { defaultOutputValue } from '../constants';

export interface SelectedSong {
  song: { value: string; label: string };
  targetKey: string;
  capo: number;
}

export interface SongSelectionState {
  selectedSong: SelectedSong;
  setSelectedSong: (song: SelectedSong) => void;
  songId: string;
  setSongId: (id: string) => void;
  isEdit: boolean;
  setIsEdit: (isEdit: boolean) => void;
}

export const useSongSelectionStore = create<SongSelectionState>((set) => ({
  selectedSong: defaultOutputValue,
  setSelectedSong: (song) => set({ selectedSong: song }),
  songId: '',
  setSongId: (id) => set({ songId: id }),
  isEdit: false,
  setIsEdit: (isEdit) => set({ isEdit }),
}));
