import { create } from 'zustand';
import { defaultOutputValue } from '../constants';

export const useSongSelectionStore = create((set) => ({
  selectedSong: defaultOutputValue,
  setSelectedSong: (song) => set({ selectedSong: song }),
  songId: '',
  setSongId: (id) => set({ songId: id }),
  isEdit: false,
  setIsEdit: (isEdit) => set({ isEdit }),
}));
