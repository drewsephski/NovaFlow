import { UniversalStore } from '@/lib/storage'
import { create } from 'zustand'

export interface Prompt {
  id: string
  title: string
  content: string
  isDefault?: boolean
}

interface PromptState {
  promptList: Prompt[]
  currentPrompt: Prompt | null
  
  initPromptData: () => Promise<void>
  setPromptList: (promptList: Prompt[]) => Promise<void>
  addPrompt: (prompt: Omit<Prompt, 'id'>) => Promise<void>
  updatePrompt: (prompt: Prompt) => Promise<void>
  deletePrompt: (id: string) => Promise<void>
  setCurrentPrompt: (prompt: Prompt | null) => Promise<void>
}

const usePromptStore = create<PromptState>((set, get) => ({
  promptList: [
    {
      id: '0',
      title: 'Writing Assistant',
      content: 'You are an intelligent assistant for a note-taking app. You can reference recorded content and use markdown syntax to answer user questions.',
      isDefault: true
    }
  ],
  currentPrompt: null,
  
  initPromptData: async () => {
    const store = new UniversalStore('store.json')
    await store.load()
    const promptList = await store.get<Prompt[]>('promptList');
    if (promptList) {
      set({ promptList });
    } else {
      // If not exists, set default
      const defaultPromptList = get().promptList;
      await store.set('promptList', defaultPromptList);
      await store.save()
    }
    
    // Set current prompt
    const currentPromptId = await store.get<string>('currentPromptId');
    if (currentPromptId) {
      const prompt = get().promptList.find(item => item.id === currentPromptId);
      if (prompt) {
        set({ currentPrompt: prompt });
      }
    } else {
      // Default to first prompt
      const defaultPrompt = get().promptList[0];
      set({ currentPrompt: defaultPrompt });
      await store.set('currentPromptId', defaultPrompt.id);
      await store.save()
    }
  },
  
  setPromptList: async (promptList) => {
    set({ promptList });
    const store = new UniversalStore('store.json');
    await store.load();
    await store.set('promptList', promptList);
    await store.save();
  },
  
  addPrompt: async (promptData) => {
    const prompt: Prompt = {
      id: Date.now().toString(),
      ...promptData
    };
    
    const promptList = [...get().promptList, prompt];
    await get().setPromptList(promptList);
  },
  
  updatePrompt: async (updatedPrompt) => {
    const promptList = get().promptList.map(prompt => 
      prompt.id === updatedPrompt.id ? updatedPrompt : prompt
    );
    
    await get().setPromptList(promptList);
    
    // If updating current prompt, update currentPrompt as well
    const currentPrompt = get().currentPrompt;
    if (currentPrompt && currentPrompt.id === updatedPrompt.id) {
      set({ currentPrompt: updatedPrompt });
    }
  },
  
  deletePrompt: async (id) => {
    // Cannot delete default prompt
    const promptToDelete = get().promptList.find(prompt => prompt.id === id);
    if (promptToDelete?.isDefault) return;
    
    const promptList = get().promptList.filter(prompt => prompt.id !== id);
    await get().setPromptList(promptList);
    
    // If deleting current prompt, set currentPrompt to default
    const currentPrompt = get().currentPrompt;
    if (currentPrompt && currentPrompt.id === id) {
      const defaultPrompt = get().promptList.find(prompt => prompt.isDefault);
      if (defaultPrompt) {
        await get().setCurrentPrompt(defaultPrompt);
      }
    }
  },
  
  setCurrentPrompt: async (prompt) => {
    set({ currentPrompt: prompt });
    if (prompt) {
      const store = new UniversalStore('store.json');
      await store.load();
      await store.set('currentPromptId', prompt.id);
      await store.save();
    }
  }
}));

export default usePromptStore;
