import { computed } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { Structure } from '../../shared/models/material.model';

interface OSState {
  eventId: string | null;
  // Agora guardamos os IDs das estruturas selecionadas, como o Back-end pede
  selectedStructureIds: string[]; 
  isLoading: boolean;
}

const initialState: OSState = {
  eventId: null,
  selectedStructureIds: [],
  isLoading: false,
};

export const OSStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ selectedStructureIds }) => ({
    // Contador de quantas estruturas foram adicionadas à OS
    structuresCount: computed(() => selectedStructureIds().length),
  })),
  withMethods((store) => ({
    // Método para vincular a OS a um evento
    setEvent(eventId: string): void {
      patchState(store, { eventId });
    },

    // Adiciona uma estrutura (ex: Tenda) à lista de IDs
    addStructure(structureId: string): void {
      const currentIds = store.selectedStructureIds();
      patchState(store, { 
        selectedStructureIds: [...currentIds, structureId] 
      });
    },

    // Remove uma estrutura da lista
    removeStructure(structureId: string): void {
      patchState(store, {
        selectedStructureIds: store.selectedStructureIds().filter(id => id !== structureId)
      });
    },

    clear(): void {
      patchState(store, initialState);
    }
  })),
);