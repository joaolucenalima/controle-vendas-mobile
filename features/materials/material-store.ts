import { create } from "zustand";

import { MaterialService } from "./material-service";
import { CreateMaterialDTO, Material, UpdateMaterialDTO } from "./material.types";

type MaterialStoreState = {
  materials: Material[];
  loadMaterials: () => Promise<void>;
  getMaterialById: (id: number) => Promise<Material>;
  createMaterial: (data: CreateMaterialDTO) => Promise<Material>;
  updateMaterial: (id: number, data: UpdateMaterialDTO) => Promise<Material>;
  deleteMaterial: (id: number) => Promise<void>;
};

export const useMaterialStore = create<MaterialStoreState>((set, get) => ({
  materials: [],

  loadMaterials: async () => {
    const materials = await MaterialService.getMaterials();
    set({ materials });
  },

  getMaterialById: async (id) => {
    return await MaterialService.getMaterialById(id);
  },

  createMaterial: async (data) => {
    const material = await MaterialService.createMaterial(data);
    await get().loadMaterials();
    return material;
  },

  updateMaterial: async (id, data) => {
    const material = await MaterialService.updateMaterial(id, data);
    await get().loadMaterials();
    return material;
  },

  deleteMaterial: async (id) => {
    await MaterialService.deleteMaterial(id);
    await get().loadMaterials();
  },
}));
