// src/inspections/entities/inspection-photo.entity.js

import { EntitySchema } from "typeorm";

export const InspectionPhotoEntity = new EntitySchema({
  name: "InspectionPhoto",
  tableName: "inspection_photos",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    inspectionId: {
      type: "uuid",
      nullable: false,
    },
    photoUrl: {
      type: "varchar",
      nullable: false,
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
    },
  },
  relations: {
    inspection: {
      target: "Inspection",
      type: "many-to-one",
      joinColumn: { name: "inspectionId" },
      onDelete: "CASCADE",
    },
  },
});